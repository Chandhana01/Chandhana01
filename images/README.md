# Images folder

Put all your website images in this folder.

## How to update the home page grid (3 × 4)

The home page (`index.html`) shows 12 tiles. Right now they use the
placeholder files `grid-01.svg` … `grid-12.svg`.

To use your own photo for a tile:

1. Copy your image into this folder (e.g. `seaweed-lab.jpg`).
2. Open `index.html` and find the tile you want, e.g.:

   ```html
   <img src="images/grid-01.svg" alt="Tile 1">
   ```

3. Change it to your file:

   ```html
   <img src="images/seaweed-lab.jpg" alt="Seaweed bioplastics lab">
   ```

4. (Optional) Update the caption in the `<figcaption>` line below it.

Tips:
- Square-ish images look best in the grid (they're cropped to squares automatically).
- Keep files under ~500 KB each so the page loads fast (resize to ~1200px wide).
- The `art.html` page works the same way — swap the `src` paths there too.
- You can delete the `grid-*.svg` placeholders once you've replaced them all.
