#!/usr/bin/env python3
"""Open-deck creatives for three brands. See opendeck/BRIEF.md

Final 4  — the specialist play (6 singles + a 6-slide carousel)
Linx     — the mixed-equipment operator, deliberately NOT competing on heavy haul
FleetConnect — B2B: recruiting open-deck operators for carriers
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

FOOT = {
 "f4":  ("FINAL 4 LOGISTICS &nbsp;&middot;&nbsp; NASHVILLE, TN", "GET DISPATCHED TODAY"),
 "linx":("LINX DISPATCH", "FREE DISPATCH FIT REVIEW"),
 "fc":  ("FLEETCONNECT", "TELL US WHO YOU NEED TO FIND"),
}
MARK = {
 "f4":  'FINAL <span>4</span> LOGISTICS',
 "linx":'LIN<span>X</span> DISPATCH',
 "fc":  'FLEET<span>CONNECT</span>',
}

def page(name, theme, *, body, sect, pips=None, swipe=None, css="",
         hero=None, hero_pos="center", scrim="scrim", banner=None):
    """hero = image filename in assets/hero/ → photo-led cinematic piece."""
    pip = ""
    if pips:
        i, n = pips
        cells = "".join(f'<i class="{"on" if k<=i else ""}"></i>' for k in range(1, n+1))
        pip = f'<div class="pips">{cells}</div>'
        if swipe: pip += f'<div class="swipe">{swipe}</div>'
    fl, fr = FOOT[theme]
    photo = ""
    photo_cls = ""
    if hero:
        photo = (f'<div class="hero" style="background-image:url(\'../../assets/hero/{hero}\');'
                 f'background-position:{hero_pos}"></div>\n  <div class="{scrim}"></div>')
        photo_cls = " photo"
        if banner:
            photo += f'\n  <div class="hero-banner">{banner}</div>'
    bloom = '<div class="bloom"></div>' if (theme == "fc" and not hero) else ""
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="_od.css">
<style>{css}</style></head><body>
<div class="canvas t-{theme}{photo_cls}">
  {bloom}{photo}
  <div class="mark">{MARK[theme]}</div>
  <div class="sect">{sect}</div>
  <div class="body">
{body}
  </div>
{pip}
  <div class="foot"><span>{fl}</span><b>{fr}</b></div>
  <div class="grain"></div>
</div>
</body></html>
"""
    open(os.path.join(HERE, name), "w").write(html)
    print("  ", name)


# ═════════════════════════════════ CINEMATIC HERO PIECES (photo-led)

PH  = " h1{font-size:80px;line-height:.98} .sub{margin-top:22px;max-width:840px;font-size:25px}"
PHb = " h1{font-size:92px;line-height:.96} .sub{margin-top:22px;max-width:840px;font-size:25px}"

# Final 4 — heavy machinery on a lowboy at a jobsite
page("H-F4-01-move.html", "f4", sect="Open deck dispatch",
     hero="F4H1.jpg", hero_pos="50% 42%", css=PHb,
     body="""    <h1>If it can&rsquo;t move legally,<br><em>it can&rsquo;t move.</em></h1>
    <div class="sub">Wrong trailer, no permit, wrong day of the week &mdash; a dispatcher who
      doesn&rsquo;t know open deck is worse than no dispatcher at all.</div>""")

# Final 4 — concrete beam / heavy haul, with the OVERSIZE banner
page("H-F4-02-oversize.html", "f4", sect="Permits &amp; routing",
     hero="F4H2.jpg", hero_pos="50% 50%", banner="OVERSIZE LOAD", css=PH,
     body="""    <h1>Permits. Route surveys.<br>Escorts. Curfews.<br><em>We handle all of it.</em></h1>
    <div class="sub">Oversize isn&rsquo;t a checkbox. It&rsquo;s a second job &mdash; and it happens
      before you ever turn a wheel.</div>""")

# Final 4 — backhoe on a flatbed, the specialist close
page("H-F4-03-rightway.html", "f4", sect="Flatbed · Stepdeck · Heavy haul",
     hero="F4H3.jpg", hero_pos="50% 44%", css=PHb,
     body="""    <h1>We move oversize loads,<br><em>the right way.</em></h1>
    <div class="sub">Flatbed, stepdeck and heavy haul dispatch, nationwide. 25+ years.
      No forced dispatch. You pick the loads.</div>""")

# Final 4 — empty gritty flatbed under a bridge, the "who's booking this" hook
page("H-F4-04-empty.html", "f4", sect="Open deck dispatch",
     hero="F4H4.jpg", hero_pos="50% 46%", css=PHb,
     body="""    <h1>An empty deck<br><em>is a decision, not luck.</em></h1>
    <div class="sub">Open deck freight is lumpier than van freight. The weeks your deck stays
      loaded are the weeks somebody&rsquo;s working the phone before you wake up.</div>""")

# Linx — mixed equipment, the flatbed-and-a-van operator (amber theme over photo)
page("H-LX-01-both.html", "linx", sect="Mixed equipment",
     hero="F4H6.jpg", hero_pos="50% 44%", css=PH + " h1{text-transform:uppercase}",
     body="""    <h1>Flatbed one week.<br>Van the next.<br><em>One dispatcher for both.</em></h1>
    <div class="sub">Most dispatchers are good at one trailer. If you run more than one,
      you need someone who keeps all of them loaded.</div>""")

# FleetConnect — recruiting, the road-train/heavy hero (violet-gold over photo)
page("H-FC-01-shortlist.html", "fc", sect="Open deck recruiting",
     hero="F4H5.jpg", hero_pos="50% 50%", css=PH,
     body="""    <h1>You can&rsquo;t post your way<br>to a <em>heavy haul driver.</em></h1>
    <div class="sub">The operators who can run an RGN and read a permit are already driving
      for somebody. Every open deck carrier is recruiting from the same short list.</div>""")


# ═════════════════════════════════ FINAL 4 — the specialist

CTR  = ".body{justify-content:center}"
BIG  = CTR + " h1{font-size:86px} .sub{margin-top:38px;max-width:830px}"
HUGE = CTR + " .kick{margin-bottom:26px} .big{font-size:250px;line-height:.9;letter-spacing:-.045em} .sub{margin-top:34px;max-width:800px}"

page("F4-01-cant-move.html", "f4", sect="Open deck dispatch",
     css=BIG + " h1{font-size:78px}",
     body="""    <h1>Ever been booked<br>on a load that<br><em>couldn&rsquo;t legally move?</em></h1>
    <div class="sub">Wrong trailer for the freight. No permit for the route. A state that
      doesn&rsquo;t allow the move on a Sunday. A dispatcher who doesn&rsquo;t know open deck
      is worse than no dispatcher at all.</div>""")

page("F4-02-136.html", "f4", sect="Legal height",
     css=HUGE,
     body="""    <div class="kick">Thirteen feet six inches</div>
    <div class="big num">13&rsquo;6&rdquo;</div>
    <div class="sub">Everything under that line is freight. Everything over it is a permit,
      a route survey, an escort, and a curfew. Your dispatcher should know which one
      they just put you on.</div>""")

page("F4-03-chains.html", "f4", sect="What you don't get paid for",
     css=BIG + " .rows{margin-top:44px}",
     body="""    <h1>Nobody pays you<br><em>to throw chains.</em></h1>
    <div class="rows">
      <div class="row"><span class="n">01</span><span class="t">Tarping a load in the rain</span><span class="v">UNPAID</span></div>
      <div class="row"><span class="n">02</span><span class="t">Chains, binders, straps, corner protectors</span><span class="v">UNPAID</span></div>
      <div class="row"><span class="n">03</span><span class="t">Forty-five minutes on the shoulder before you turn a wheel</span><span class="v">UNPAID</span></div>
      <div class="row"><span class="n">04</span><span class="t">Waiting on a crane at a jobsite with no dock</span><span class="v">UNPAID</span></div>
    </div>
    <div class="sub" style="margin-top:34px">Tarp pay and securement time are line items.
      Most operators never ask. A dispatcher who works open deck every day does.</div>""")

page("F4-04-oversize.html", "f4", sect="Permits &amp; routing",
     css=CTR + " .banner{margin-bottom:36px} h1{font-size:74px} .rows{margin-top:38px} .sub{margin-top:30px;max-width:820px;font-size:23px}",
     body="""    <div class="banner">OVERSIZE LOAD</div>
    <h1>It isn&rsquo;t a checkbox.<br><em>It&rsquo;s a second job.</em></h1>
    <div class="rows">
      <div class="row"><span class="n">&mdash;</span><span class="t">State-by-state permits</span></div>
      <div class="row"><span class="n">&mdash;</span><span class="t">Route surveys and bridge restrictions</span></div>
      <div class="row"><span class="n">&mdash;</span><span class="t">Escort and pilot car coordination</span></div>
      <div class="row"><span class="n">&mdash;</span><span class="t">Curfew windows and no-move days</span></div>
    </div>
    <div class="sub">We help secure the right permits and plan safe, legal routes, so you
      can avoid delays and keep moving.</div>""")

page("F4-05-vocabulary.html", "f4", sect="Equipment",
     css=BIG + " h1{font-size:80px} .strip{margin-top:50px}",
     body="""    <h1>Your dispatcher should<br>know the difference<br><em>before they book you.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v num">Step<br>deck</div><div class="k">Two-level<br>deck height</div></div>
      <div class="cell"><div class="v num">Double<br>drop</div><div class="k">Well for<br>tall freight</div></div>
      <div class="cell"><div class="v num">RGN</div><div class="k">Detachable neck,<br>drive-on loads</div></div>
    </div>
    <div class="sub" style="margin-top:34px">Open deck freight &mdash; flatbed, stepdeck, RGN
      and oversized. Equipment, steel, wide loads.</div>""")

page("F4-06-offer.html", "f4", sect="Get started",
     css=CTR + " h1{font-size:76px} .rows{margin-top:40px} .strip{margin-top:36px}",
     body="""    <h1>We move oversize loads,<br><em>the right way.</em></h1>
    <div class="rows">
      <div class="row"><span class="n">01</span><span class="t">Flatbed &amp; stepdeck dispatch</span></div>
      <div class="row"><span class="n">02</span><span class="t">Heavy haul dispatch</span></div>
      <div class="row"><span class="n">03</span><span class="t">CDL driver recruitment</span></div>
    </div>
    <div class="strip">
      <div class="cell"><div class="v num">25+</div><div class="k">Years<br>experience</div></div>
      <div class="cell"><div class="v num">24/7</div><div class="k">Dedicated<br>dispatcher</div></div>
      <div class="cell"><div class="v num">No</div><div class="k">Forced<br>dispatch</div></div>
    </div>""")

# ---- Final 4 carousel: what a dispatcher has to know before booking you
NUMS = CTR + """ .kick{margin-bottom:22px}
  .big{font-size:190px;line-height:.9;letter-spacing:-.04em}
  .sub{margin-top:32px;max-width:800px;font-size:24px}"""

for i, s in enumerate([
 dict(sect="01 / 06", css=BIG + " h1{font-size:80px}",
      body="""    <h1>Four numbers your<br>dispatcher has to know<br><em>before they book you.</em></h1>
    <div class="sub">Get any of them wrong and the load doesn&rsquo;t move.</div>"""),
 dict(sect="02 / 06", css=NUMS,
      body="""    <div class="kick">Legal width</div><div class="big num">8&rsquo;6&rdquo;</div>
    <div class="sub">Past this you are oversize. Different permit, different route,
      possibly an escort.</div>"""),
 dict(sect="03 / 06", css=NUMS,
      body="""    <div class="kick">Legal height</div><div class="big num">13&rsquo;6&rdquo;</div>
    <div class="sub">Past this you are checking every bridge and overpass on the route,
      not just the mileage.</div>"""),
 dict(sect="04 / 06", css=NUMS,
      body="""    <div class="kick">Legal gross</div><div class="big num">80,000</div>
    <div class="sub">Pounds. Past this you are into overweight permits and axle
      configurations, per state.</div>"""),
 dict(sect="05 / 06", css=CTR + " .banner{margin-bottom:34px} h1{font-size:76px} .sub{margin-top:34px;max-width:820px}",
      body="""    <div class="banner">OVERSIZE LOAD</div>
    <h1>Past any of them,<br><em>it&rsquo;s a second job.</em></h1>
    <div class="sub">Permits, route surveys, escorts, curfew windows, no-move days.
      That work happens before you ever turn a wheel &mdash; and somebody has to do it.</div>"""),
 dict(sect="06 / 06", css=BIG + " h1{font-size:80px}",
      body="""    <h1>That&rsquo;s not extra.<br><em>That&rsquo;s the job.</em></h1>
    <div class="sub">Final 4 Logistics dispatches flatbed, stepdeck and heavy haul
      nationwide &mdash; permits and routing included. No forced dispatch.</div>"""),
], 1):
    page(f"F4-C1-{i:02d}.html", "f4", pips=(i, 6),
         swipe="Swipe &rarr;" if i < 6 else "", **s)


# ═════════════════════════════════ LINX — the mixed-equipment operator

LBIG = CTR + " h1{font-size:98px} .sub{margin-top:40px;max-width:820px}"

page("LX-01-two-trailers.html", "linx", sect="Mixed equipment",
     css=LBIG,
     body="""    <h1>You run a flatbed.<br>And a van.<br><em>And sometimes<br>a hotshot.</em></h1>
    <div class="sub">Most dispatchers are good at one of those. You need someone who can
      keep all of them loaded in the same week.</div>""")

page("LX-02-rate-structures.html", "linx", sect="Mixed equipment",
     css=CTR + " h1{font-size:88px} .rows{margin-top:44px} .sub{margin-top:32px;max-width:820px}",
     body="""    <h1>Two trailers.<br>Two rate structures.<br><em>One person who<br>knows both.</em></h1>
    <div class="rows">
      <div class="row"><span class="n">01</span><span class="t">Flatbed &mdash; tarp pay, securement time, jobsite waits</span></div>
      <div class="row"><span class="n">02</span><span class="t">Dry van &mdash; detention, drop-and-hook, appointment windows</span></div>
      <div class="row"><span class="n">03</span><span class="t">Hotshot &mdash; speed, weight limits, tighter margins</span></div>
    </div>""")

page("LX-03-whatever-pays.html", "linx", sect="Mixed equipment",
     css=LBIG + " h1{font-size:92px}",
     body="""    <h1>Some weeks the<br>flatbed pays.<br><em>Some weeks<br>the van does.</em></h1>
    <div class="sub">If your dispatcher only books one of them, you are running half a
      business and calling it a slow month.</div>""")

page("LX-04-offer.html", "linx", sect="The offer",
     css=CTR + " h1{font-size:92px} .strip{margin-top:46px} .sub{margin-top:32px;max-width:820px;font-size:23px}",
     body="""    <h1>One dispatcher.<br><em>All of your equipment.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v num">1&ndash;10</div><div class="k">Trucks</div></div>
      <div class="cell"><div class="v num">6</div><div class="k">Equipment types<br>covered</div></div>
      <div class="cell"><div class="v num">Free</div><div class="k">Dispatch<br>fit review</div></div>
    </div>
    <div class="sub">Dry van &middot; Reefer &middot; Flatbed &middot; Hotshot &middot; Box truck &middot; Tanker</div>""")


# ═════════════════════════════════ FLEETCONNECT — recruiting open-deck operators

CBIG = CTR + " h1{font-size:84px} .sub{margin-top:38px;max-width:830px}"

page("FCO-01-cant-post.html", "fc", sect="Open deck recruiting",
     css=CBIG,
     body="""    <h1>You can&rsquo;t post<br>your way to a<br><em>heavy haul driver.</em></h1>
    <div class="sub">The people who can run an RGN and read a permit are not sitting on a
      job board waiting to be found. They are already driving for somebody.</div>""")

page("FCO-02-short-list.html", "fc", sect="Open deck recruiting",
     css=CBIG + " h1{font-size:78px}",
     body="""    <h1>Every open deck<br>carrier is recruiting<br><em>from the same<br>short list.</em></h1>
    <div class="sub">The qualified pool is a fraction of the van pool. Which means the
      whole thing comes down to who reaches them first, and who follows up.</div>""")

page("FCO-03-configured.html", "fc", sect="One system, configured",
     css=CTR + " h1{font-size:80px} .rows{margin-top:42px} .sub{margin-top:32px;max-width:820px;font-size:23px}",
     body="""    <h1>Configured for<br><em>open deck.</em></h1>
    <div class="rows">
      <div class="row"><span class="n">01</span><span class="t">Targeting by equipment and endorsement, not just CDL-A</span></div>
      <div class="row"><span class="n">02</span><span class="t">Qualification that asks about securement and oversize experience</span></div>
      <div class="row"><span class="n">03</span><span class="t">Follow-up and reactivation, because this list is too small to waste</span></div>
    </div>
    <div class="sub">The same eleven-part install. Pointed at a much narrower group of people.</div>""")

page("FCO-04-offer.html", "fc", sect="Pricing &amp; capacity",
     css=CTR + " h1{font-size:80px} .strip{margin-top:46px} .sub{margin-top:32px;max-width:850px;font-size:19px}",
     body="""    <h1>Tell us who you<br>need to <em>find.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v num">$3,500&ndash;$7,500</div><div class="k">Install</div></div>
      <div class="cell"><div class="v num">3</div><div class="k">Installs<br>per month</div></div>
      <div class="cell"><div class="v num">30</div><div class="k">Day activation<br>guarantee</div></div>
    </div>
    <div class="sub">The guarantee covers delivery and activation &mdash; that the system gets
      built and turned on. It is not a guarantee of hires, revenue or campaign performance.</div>""")

print("\ndone.")
