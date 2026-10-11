#!/usr/bin/env python3
"""Keep page sections modular: background fields and the section menu.

Usage (from the repository root):
    python3 tools/sections.py          check every page, change nothing
    python3 tools/sections.py --fix    renumber fields and rebuild section menus

Background fields
    A field is a top-level element inside <main> (a <section>, or a
    <div class="field"> wrapping several sections) that carries bg-1..bg-4 or
    the attribute data-field. Fields cycle from the top of the page:
        1 dark primary, 2 light primary, 3 dark secondary, 4 light secondary, 1 ...
    Transition art exists for exactly this cycle, so following it guarantees a
    painted transition between every pair. Companion classes follow the
    position too: light fields (2, 4) carry t-v2 (the tall phone transition);
    every dark-primary field after the first carries m-d2 (its phone texture).
    A new section only needs class="section ..." plus data-field; --fix gives
    it, and every field after it, the right numbers.
    Keep a deliberate extra companion with data-field-keep, for example
    data-field-keep="t-v2". Other classes (bg-tile, bg-pos-*, m-lp ...) are
    left exactly as written.

Section menu (.subnav)
    Pages with a section menu list every element that carries
    data-nav="Label" (any depth inside <main>), in page order. Optional
    data-nav-class adds a class to that menu item. --fix rewrites the list.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CYCLE = [1, 2, 3, 4]
TOP = re.compile(r'^<(section|div)\b([^>]*)>', re.M)

def attr(attrs, name):
    m = re.search(r'\b%s="([^"]*)"' % name, attrs)
    return m.group(1) if m else None

def expected(i, keep):
    fam = CYCLE[i % 4]
    want = {'bg-%d' % fam}
    if fam in (2, 4): want.add('t-v2')
    if fam == 1 and i > 0: want.add('m-d2')
    return fam, want | (set(keep) & {'t-v2', 'm-d2'})

def recompute(classes, i, keep):
    toks = classes.split()
    fam, want = expected(i, keep)
    managed = {'bg-1', 'bg-2', 'bg-3', 'bg-4', 't-v2', 'm-d2'}
    if {t for t in toks if t in managed} == want:
        return classes, fam
    out, placed = [], False
    for t in toks:
        if t in managed:
            if not placed:          # put the field classes where the old ones were
                out += ['bg-%d' % fam] + [c for c in ('m-d2', 't-v2') if c in want]
                placed = True
            continue
        out.append(t)
    if not placed:
        out += ['bg-%d' % fam] + [c for c in ('m-d2', 't-v2') if c in want]
    return ' '.join(out), fam

def process(path, fix):
    s = open(path, encoding='utf-8').read()
    mm = re.search(r'<main\b[^>]*>', s)
    if not mm: return [], s
    a, b = mm.end(), s.index('</main>')
    main = s[a:b]
    notes, fields, inside_wrapper = [], [], False
    for m in TOP.finditer(main):
        tag, attrs = m.group(1), m.group(2)
        cls = attr(attrs, 'class') or ''
        is_field = bool(re.search(r'\bbg-[1-4]\b', cls)) or re.search(r'\bdata-field\b(?!-)', attrs)
        if tag == 'div' and 'field' in cls.split():
            inside_wrapper = True
        elif tag == 'section' and not is_field and not inside_wrapper:
            notes.append('a top-level <section> without a field interrupts the background cycle (id=%s)' % (attr(attrs, 'id') or '-'))
        if tag == 'section' and is_field:
            inside_wrapper = False
        if is_field:
            fields.append(m)
    seq, new_main, last = [], [], 0
    for i, m in enumerate(fields):
        attrs = m.group(2)
        cls = attr(attrs, 'class') or ''
        keep = (attr(attrs, 'data-field-keep') or '').split()
        new_cls, fam = recompute(cls, i, keep)
        label = str(fam) + ('t' if 't-v2' in new_cls.split() else '') + ('d' if 'm-d2' in new_cls.split() else '')
        seq.append(label)
        if new_cls != cls:
            notes.append('field %d (id=%s): "%s" -> "%s"' % (i + 1, attr(attrs, 'id') or '-', cls, new_cls))
            new_attrs = re.sub(r'\bclass="[^"]*"', 'class="%s"' % new_cls, attrs, count=1) if 'class="' in attrs else attrs + ' class="%s"' % new_cls
            new_main.append(main[last:m.start()] + '<%s%s>' % (m.group(1), new_attrs))
            last = m.end()
    new_main.append(main[last:])
    main2 = ''.join(new_main)
    out = s[:a] + main2 + s[b:]
    # section menu
    nav = re.search(r'(<nav class="subnav"[^>]*>\s*<ul>\n)(.*?)(\s*</ul>)', out, re.S)
    if nav:
        tagged = []
        for t in re.finditer(r'<[a-z]+\b([^>]*\bdata-nav="[^"]*"[^>]*)>', main2):
            at = t.group(1); tagged.append((attr(at, 'id'), attr(at, 'data-nav'), attr(at, 'data-nav-class')))
        if tagged:
            missing = [lbl for i_, lbl, _ in tagged if not i_]
            if missing: notes.append('data-nav without an id: %s' % ', '.join(missing))
            lines = []
            for i_, lbl, c in tagged:
                if not i_: continue
                li = '<li class="%s">' % c if c else '<li>'
                lines.append('    %s<a data-section="%s" href="#%s">%s</a></li>' % (li, i_, i_, lbl))
            body = '\n'.join(lines)
            if nav.group(2) != body:
                notes.append('section menu differs from data-nav labels')
                out = out[:nav.start(2)] + body + out[nav.end(2):]
        else:
            notes.append('section menu present but no data-nav labels; menu left as written')
        for sid in re.findall(r'data-section="([^"]+)"', out[nav.start():nav.end()] if nav else ''):
            if not re.search(r'\bid="%s"' % re.escape(sid), main2): notes.append('menu item #%s has no matching id' % sid)
    if fix and out != s:
        open(path, 'w', encoding='utf-8').write(out)
    return [' '.join(seq)] + notes, out

def main():
    fix = '--fix' in sys.argv
    problems = 0
    for path in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
        lines, _ = process(path, fix)
        if not lines: continue
        seq, notes = lines[0], lines[1:]
        problems += len(notes)
        print('%-20s %s' % (os.path.basename(path), seq))
        for n in notes: print('    ' + ('fixed: ' if fix else '') + n)
    print('\n%s' % ('Done.' if fix else ('All pages follow the field cycle and menus match.' if not problems else '%d item(s) to fix: run with --fix' % problems)))
    return 0 if (fix or not problems) else 1

if __name__ == '__main__':
    sys.exit(main())
