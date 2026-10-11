# Adding or moving sections

Pages are built from **fields**: top-level sections inside `<main>` that carry a background. The site handles everything else around a section automatically. Two things are written into the markup, and one command keeps them right:

1. **Background number and companions.** Fields cycle from the top of each page: 1 dark primary, 2 light primary, 3 dark secondary, 4 light secondary, then 1 again. Transition artwork exists for exactly this cycle, so keeping it guarantees a painted transition between every pair, on phones and desktop, and a soft fade into the footer.
2. **The section menu** (the pills under the header on longer pages). It lists every element that carries `data-nav="Label"`, in page order.

```bash
python3 tools/sections.py          # check every page, change nothing
python3 tools/sections.py --fix    # renumber backgrounds and rebuild the section menus
```

## Add a section

Paste this at the top level of `<main>`, between two existing sections, then run `--fix`:

```html
<section id="your-id" data-scroll-section data-nav="Menu label" class="section" data-field aria-labelledby="your-id-title">
  <div data-reveal class="wrap stack stack--lg">
    <h2 id="your-id-title" class="marker">Section label</h2>
    <p class="lede">Opening line.</p>
    <div class="prose">
      <p>Body text.</p>
    </div>
  </div>
</section>
```

`--fix` gives the new section its background, and renumbers every section after it. Everything else follows on its own:

- background texture and its loading;
- transitions into and out of the section;
- the scroll reveal of its contents (anything inside `data-reveal`);
- the "next section" button (`data-scroll-section`);
- its pill in the section menu (`data-nav`; leave it out to keep the section off the menu).

Pages without a section menu, such as the homepage, simply ignore `data-nav`.

## Options

- `bg-tile`: for long sections. The texture repeats down the section instead of stretching.
- `bg-pos-lower`, `bg-pos-bottom`: anchor the texture lower on phones.
- `data-field-keep="t-v2"`: keep the tall phone transition on a dark field. Story's closing section uses this.
- `data-nav-class="..."`: adds a class to that section's menu item.
- To give several sections one shared background, wrap them in `<div class="field">` with the background classes on the wrapper. The Groups opening and the Alignment Call form do this.

Removing or reordering sections works the same way: edit, then run `--fix`.
