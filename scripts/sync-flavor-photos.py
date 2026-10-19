"""Download exact-name official flavor photos; keep unknowns as illustrations.

Run from any directory with Python 3. No third-party Python dependencies.
Images are copied without modification, preserving TLS verification.
"""
import concurrent.futures
import datetime
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MENU = 'https://www.lovecreamery.com/ice-cream-flavors/'


def request(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)


def normalized(name):
    return ' '.join(name.casefold().replace('’', "'").split())


class FlavorPhotos(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.card = None
        self.title = False
        self.photos = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div':
            if self.card is not None:
                self.depth += 1
            elif {'card', 'flavor'} <= set(attrs.get('class', '').split()):
                self.card = {'name': '', 'images': []}
                self.depth = 1
        if self.card is not None:
            if tag == 'h5':
                self.title = True
            if tag == 'img':
                src = attrs.get('data-src', attrs.get('src', ''))
                path = urllib.parse.urlparse(src).path
                # The shop's generic placeholder is not a flavor photograph.
                if path.startswith('/wp-content/uploads/') and Path(path).suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
                    self.card['images'].append((src, attrs.get('alt', '')))

    def handle_endtag(self, tag):
        if tag == 'h5':
            self.title = False
        if tag == 'div' and self.card is not None:
            self.depth -= 1
            if self.depth == 0:
                if self.card['images']:
                    self.photos[normalized(self.card['name'])] = self.card['images'][0]
                self.card = None

    def handle_data(self, data):
        if self.card is not None and self.title:
            self.card['name'] += data


def main():
    with request(MENU) as response:
        html = response.read().decode('utf-8')
    parser = FlavorPhotos()
    parser.feed(html)
    catalog = json.loads((ROOT / 'src/catalog.json').read_text())
    metadata_path = ROOT / 'src/flavorPhotos.json'
    metadata = json.loads(metadata_path.read_text()) if metadata_path.exists() else {}
    targets = [flavor for flavor in catalog if not flavor['demo'] and normalized(flavor['name']) in parser.photos]
    if not targets:
        raise RuntimeError('No exact-name flavor photos found; existing assets were left unchanged.')
    asset_dir = ROOT / 'public/flavors'
    asset_dir.mkdir(exist_ok=True)

    def download(flavor):
        source, alt = parser.photos[normalized(flavor['name'])]
        parts = urllib.parse.urlparse(source)
        if parts.hostname not in ('lovecreamery.com', 'www.lovecreamery.com'):
            raise ValueError('Unexpected image host: ' + str(parts.hostname))
        download_url = urllib.parse.urlunparse(parts._replace(netloc='www.lovecreamery.com'))
        with request(download_url) as response:
            if not response.headers.get('Content-Type', '').startswith('image/'):
                raise ValueError('Source is not an image: ' + source)
            content = response.read(10_000_001)
        if not content or len(content) > 10_000_000:
            raise ValueError('Unexpected image size for ' + flavor['name'])
        if not re.fullmatch(r'[a-z0-9-]+', flavor['id']):
            raise ValueError('Unsafe flavor id')
        filename = flavor['id'] + Path(parts.path).suffix.lower()
        (asset_dir / filename).write_bytes(content)
        return flavor['id'], {
            'name': flavor['name'], 'path': 'flavors/' + filename,
            'alt': alt.strip() or 'Official website photograph of ' + flavor['name'],
            'source': source, 'listingSource': MENU,
            'checked': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        }

    failures = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(download, flavor): flavor['name'] for flavor in targets}
        for future in concurrent.futures.as_completed(futures):
            try:
                key, value = future.result()
                metadata[key] = value
                print('Downloaded:', value['name'], flush=True)
            except Exception as error:
                failures.append(futures[future])
                print('Could not download:', futures[future], str(error), flush=True)
    metadata_path.write_text(json.dumps(dict(sorted(metadata.items())), indent=2, ensure_ascii=False) + '\n')
    missing = [f['name'] for f in catalog if not f['demo'] and f['id'] not in metadata]
    print('Official photos:', len(metadata), '| Illustration fallback:', missing, '| Failed:', failures)
    if failures:
        raise RuntimeError('Some downloads failed; inspect output before retrying.')


if __name__ == '__main__':
    main()
