#!/usr/bin/env python3
"""FleetConnect creatives — built against the live site.

Source of truth: https://fleet-connect-gray.vercel.app/
Copy, numbers, guarantee wording and palette are all taken from there.
See fleetconnect/COPY-DECK.md for the claims audit.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FOOT_L = "FLEETCONNECT"
FOOT_R = "TELL US WHO YOU NEED TO FIND"


def page(name, *, body, sect, foot_l=FOOT_L, foot_r=FOOT_R,
         bloom="bloom", pips=None, swipe=None, extra_css="", pre=""):
    pipbar = ""
    if pips:
        i, n = pips
        cells = "".join(f'<i class="{"on" if k <= i else ""}"></i>' for k in range(1, n + 1))
        pipbar = f'<div class="pips">{cells}</div>'
        if swipe:
            pipbar += f'<div class="swipe">{swipe}</div>'
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="_fc.css">
<style>{extra_css}</style></head><body>
<div class="canvas">
  <div class="{bloom}"></div>
{pre}  <div class="mark">FLEET<span>CONNECT</span></div>
  <div class="sect">{sect}</div>
  <div class="body">
{body}
  </div>
{pipbar}
  <div class="foot"><span>{foot_l}</span><b>{foot_r}</b></div>
  <div class="grain"></div>
</div>
</body></html>
"""
    open(os.path.join(HERE, name), "w").write(html)
    print("  wrote", name)


# ══════════════════════════════════════════════════════════ SINGLES

page("FC01-everyone.html", sect="The core problem", bloom="bloom",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:104px;line-height:1.0}
       .sub{margin-top:44px;max-width:830px;font-size:28px}
       .rule{height:1px;background:var(--hair);margin-top:44px}
     """,
     body="""    <h1>Everyone in<br>trucking is<br><em>looking for<br>someone.</em></h1>
    <div class="rule"></div>
    <div class="sub">Carriers need drivers. Dispatchers need carriers. Brokers need shippers.
      Almost all of it still runs on referrals, cold lists and luck.</div>""")

page("FC02-who.html", sect="One system, configured", bloom="bloom gold",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:78px}
       .targets{margin-top:48px}
     """,
     body="""    <h1>Tell us who you<br>need to <em>find.</em></h1>
    <div class="targets">
      <div class="tgt on"><span class="ix">01</span><span class="n">Drivers</span><span class="m">Company &amp; CDL-A</span></div>
      <div class="tgt on"><span class="ix">02</span><span class="n">Owner-Operators</span><span class="m">Lease-on ready</span></div>
      <div class="tgt on"><span class="ix">03</span><span class="n">Carriers</span><span class="m">In your lanes</span></div>
      <div class="tgt on"><span class="ix">04</span><span class="n">Shippers</span><span class="m">Direct freight</span></div>
      <div class="tgt on"><span class="ix">05</span><span class="n">Customers</span><span class="m">Decision-makers</span></div>
    </div>""")

page("FC03-careers-page.html", sect="Proof &mdash; driver acquisition", bloom="bloom low",
     extra_css="""
       .body{justify-content:center}
       .kick{margin-bottom:26px}
       h1{font-size:82px}
       .strip{margin-top:54px}
       .sub{margin-top:36px;max-width:800px;font-size:22px}
     """,
     body="""    <div class="kick">Regional carrier &nbsp;&middot;&nbsp; driver acquisition</div>
    <h1>Turned a dead<br>careers page into<br><em>a steady flow.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v">40&ndash;120</div><div class="k">Applications<br>per month</div></div>
      <div class="cell"><div class="v plain">Pre-qualified</div><div class="k">Before they reach<br>your desk</div></div>
      <div class="cell"><div class="v plain">30 days</div><div class="k">To activation,<br>guaranteed</div></div>
    </div>
    <div class="sub">Application volume is the driver-acquisition model. It is a throughput
      range, not a promise of hires.</div>""")

page("FC04-referrals.html", sect="Proof &mdash; carrier acquisition", bloom="bloom low",
     extra_css="""
       .body{justify-content:center}
       .kick{margin-bottom:26px}
       h1{font-size:84px}
       .sub{margin-top:40px;max-width:820px;font-size:25px}
       .strip{margin-top:46px}
     """,
     body="""    <div class="kick v">Dispatch company &nbsp;&middot;&nbsp; carrier acquisition</div>
    <h1>Referrals aren&rsquo;t<br>a growth plan.<br><em>They&rsquo;re a queue you<br>don&rsquo;t control.</em></h1>
    <div class="sub">Replaced referral-dependence with a repeatable way to add carriers
      in their lanes.</div>
    <div class="strip">
      <div class="cell"><div class="v">15&ndash;40</div><div class="k">Qualified owner-operator<br>conversations per month</div></div>
      <div class="cell"><div class="v plain">Repeatable</div><div class="k">Not dependent on who<br>happens to refer you</div></div>
    </div>""")

page("FC05-install.html", sect="What gets installed", bloom="bloom",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:74px}
       .sub{margin-top:26px;max-width:790px;font-size:23px}
       .steps{margin-top:42px}
     """,
     body="""    <h1>We don&rsquo;t hand you<br>leads. We install<br><em>the system.</em></h1>
    <div class="sub">Eleven parts, built for your market and your lanes, then operated.</div>
    <div class="steps">
      <div class="step"><span class="no">01</span><span class="nm">Targeting</span></div>
      <div class="step"><span class="no">07</span><span class="nm">Scheduling</span></div>
      <div class="step"><span class="no">02</span><span class="nm">Sourcing</span></div>
      <div class="step"><span class="no">08</span><span class="nm">Follow-Up</span></div>
      <div class="step"><span class="no">03</span><span class="nm">Outreach &amp; Ads</span></div>
      <div class="step"><span class="no">09</span><span class="nm">Reactivation</span></div>
      <div class="step"><span class="no">04</span><span class="nm">Application Funnel</span></div>
      <div class="step"><span class="no">10</span><span class="nm">Reporting</span></div>
      <div class="step"><span class="no">05</span><span class="nm">CRM</span></div>
      <div class="step"><span class="no">11</span><span class="nm">Optimization</span></div>
      <div class="step" style="border-bottom:none"><span class="no">06</span><span class="nm">Qualification</span></div>
      <div class="step" style="border-bottom:none"></div>
    </div>""")

page("FC06-offer.html", sect="Pricing &amp; capacity", bloom="bloom gold",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:78px}
       .strip{margin-top:48px}
       .note{margin-top:34px;padding-top:26px;border-top:1px solid var(--hair);
             font-family:'Inter',sans-serif;font-size:18.5px;line-height:1.52;color:var(--dim);max-width:850px}
       .note b{color:var(--lav);font-weight:700}
     """,
     body="""    <h1>Live in 30 days,<br>or we keep working<br><em>at no extra fee.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v">$3,500&ndash;$7,500</div><div class="k">Install</div></div>
      <div class="cell"><div class="v plain">3</div><div class="k">New installs<br>per month</div></div>
      <div class="cell"><div class="v plain">30</div><div class="k">Day activation<br>guarantee</div></div>
    </div>
    <div class="note"><b>Read this part carefully.</b> The guarantee covers delivery and
      activation &mdash; that the system gets built and turned on. It is not a guarantee of
      hires, revenue, customers or campaign performance. Ongoing management is priced to
      campaign volume, channels and target markets.</div>""")


# ══════════════════════════════════════════════════════════ CAROUSELS

def carousel(prefix, n, slides):
    for i, s in enumerate(slides, 1):
        page(f"{prefix}-{i:02d}.html", pips=(i, n),
             swipe="Swipe &rarr;" if i < n else "", **s)

BIG = ".body{justify-content:center} h1{font-size:92px} .sub{margin-top:40px;max-width:830px}"
LINE = """.body{justify-content:center}
  .kick{margin-bottom:24px}
  h1{font-size:86px}
  .sub{margin-top:38px;max-width:800px;font-size:24px}"""

# ---- C1 · EVERYONE IS LOOKING FOR SOMEONE
carousel("C1", 6, [
 dict(sect="01 / The core problem", bloom="bloom", extra_css=BIG,
      body="""    <h1>Everyone in trucking<br>is <em>looking for<br>someone.</em></h1>
    <div class="sub">And almost nobody has a system for it.</div>"""),
 dict(sect="01 / The core problem", bloom="bloom low", extra_css=LINE,
      body="""    <div class="kick">If you run a fleet</div>
    <h1>You&rsquo;re looking<br>for <em>drivers.</em></h1>
    <div class="sub">And your careers page has been quiet for months.</div>"""),
 dict(sect="01 / The core problem", bloom="bloom low", extra_css=LINE,
      body="""    <div class="kick v">If you dispatch</div>
    <h1>You&rsquo;re looking<br>for <em>carriers.</em></h1>
    <div class="sub">And every one so far has come from somebody who knew somebody.</div>"""),
 dict(sect="01 / The core problem", bloom="bloom low", extra_css=LINE,
      body="""    <div class="kick">If you broker</div>
    <h1>You&rsquo;re looking<br>for <em>shippers.</em></h1>
    <div class="sub">And your reps are still working a cold list somebody bought in March.</div>"""),
 dict(sect="01 / The core problem", bloom="bloom", extra_css=BIG,
      body="""    <h1>Same problem.<br><em>Five different<br>words for it.</em></h1>
    <div class="sub">Find the right people. Qualify them. Follow up until they answer.
      Almost everyone in this industry is doing that by hand.</div>"""),
 dict(sect="02 / How it works", bloom="bloom gold", extra_css=BIG,
      body="""    <h1>One system.<br><em>Configured for who<br>you need to find.</em></h1>
    <div class="sub">FleetConnect installs and operates it &mdash; targeting through
      optimization &mdash; and it is live in 30 days.</div>"""),
])

# ---- C2 · WHAT GETS INSTALLED
GRID = """.body{justify-content:center}
  .kick{margin-bottom:22px}
  h1{font-size:72px}
  .steps{margin-top:42px;grid-template-columns:1fr}
  .step{padding:19px 0}
  .step .nm{font-size:27px}
  .sub{margin-top:34px;max-width:790px;font-size:22px}"""

carousel("C2", 6, [
 dict(sect="02 / How it works", bloom="bloom gold", extra_css=BIG,
      body="""    <h1>We don&rsquo;t hand<br>you leads.<br><em>We install<br>the system.</em></h1>
    <div class="sub">Eleven parts. Built for your market, then operated for you.</div>"""),
 dict(sect="02 / How it works", bloom="bloom", extra_css=GRID,
      body="""    <div class="kick">Find them</div>
    <h1>01 &ndash; 03</h1>
    <div class="steps">
      <div class="step"><span class="no">01</span><span class="nm">Targeting</span></div>
      <div class="step"><span class="no">02</span><span class="nm">Sourcing</span></div>
      <div class="step" style="border-bottom:none"><span class="no">03</span><span class="nm">Outreach &amp; Advertising</span></div>
    </div>
    <div class="sub">Who they are, where they are, and what actually gets them to respond.</div>"""),
 dict(sect="02 / How it works", bloom="bloom", extra_css=GRID,
      body="""    <div class="kick">Capture them</div>
    <h1>04 &ndash; 06</h1>
    <div class="steps">
      <div class="step"><span class="no">04</span><span class="nm">Application Funnel</span></div>
      <div class="step"><span class="no">05</span><span class="nm">CRM</span></div>
      <div class="step" style="border-bottom:none"><span class="no">06</span><span class="nm">Qualification</span></div>
    </div>
    <div class="sub">So nobody lands in an inbox and quietly dies there.</div>"""),
 dict(sect="02 / How it works", bloom="bloom", extra_css=GRID,
      body="""    <div class="kick">Keep them</div>
    <h1>07 &ndash; 09</h1>
    <div class="steps">
      <div class="step"><span class="no">07</span><span class="nm">Scheduling</span></div>
      <div class="step"><span class="no">08</span><span class="nm">Follow-Up</span></div>
      <div class="step" style="border-bottom:none"><span class="no">09</span><span class="nm">Reactivation</span></div>
    </div>
    <div class="sub">This is where most operations lose the people they already paid to find.</div>"""),
 dict(sect="02 / How it works", bloom="bloom", extra_css=GRID,
      body="""    <div class="kick">Improve it</div>
    <h1>10 &ndash; 11</h1>
    <div class="steps">
      <div class="step"><span class="no">10</span><span class="nm">Reporting</span></div>
      <div class="step" style="border-bottom:none"><span class="no">11</span><span class="nm">Optimization</span></div>
    </div>
    <div class="sub">You see what the system is doing, and it gets sharper every month.</div>"""),
 dict(sect="05 / Pricing &amp; capacity", bloom="bloom gold", extra_css=BIG + """
       .note{margin-top:36px;padding-top:24px;border-top:1px solid var(--hair);
             font-family:'Inter',sans-serif;font-size:18px;line-height:1.5;color:var(--dim)}""",
      body="""    <h1>Live in 30 days,<br><em>or we keep going<br>at no extra fee.</em></h1>
    <div class="sub">Install $3,500&ndash;$7,500. Three new installs a month, and that is the
      whole capacity.</div>
    <div class="note">The guarantee covers delivery and activation &mdash; that the system gets
      built and turned on. It is not a guarantee of hires, revenue or campaign performance.</div>"""),
])

# ---- C3 · FOUR BUSINESSES, FOUR THINGS THEY NEEDED
PROOF = """.body{justify-content:center}
  .card{margin-top:38px}
  h1{font-size:68px}
  .sub{margin-top:30px;max-width:800px;font-size:22px}"""

carousel("C3", 6, [
 dict(sect="04 / Proof", bloom="bloom", extra_css=BIG,
      body="""    <h1>Four businesses.<br><em>Four different<br>people to find.</em></h1>
    <div class="sub">Same system underneath. Configured differently for each.</div>"""),
 dict(sect="04 / Proof", bloom="bloom low", extra_css=PROOF,
      body="""    <h1>A regional carrier<br>needed <em>drivers.</em></h1>
    <div class="card"><div class="who">Driver acquisition</div>
      <div class="q">&ldquo;Turned a dead careers page into a steady flow of pre-qualified
        driver applications.&rdquo;</div></div>
    <div class="sub">The driver model runs 40&ndash;120 applications a month.</div>"""),
 dict(sect="04 / Proof", bloom="bloom low", extra_css=PROOF,
      body="""    <h1>A dispatch company<br>needed <em>carriers.</em></h1>
    <div class="card"><div class="who">Carrier acquisition</div>
      <div class="q">&ldquo;Replaced referral-dependence with a repeatable way to add
        carriers in their lanes.&rdquo;</div></div>
    <div class="sub">Growth stopped depending on who happened to know somebody.</div>"""),
 dict(sect="04 / Proof", bloom="bloom low", extra_css=PROOF,
      body="""    <h1>A freight broker<br>needed <em>shippers.</em></h1>
    <div class="card"><div class="who">Shipper acquisition</div>
      <div class="q">&ldquo;Reps now spend their time on qualified shipper conversations
        instead of cold lists.&rdquo;</div></div>
    <div class="sub">Same headcount. Very different day.</div>"""),
 dict(sect="04 / Proof", bloom="bloom low", extra_css=PROOF,
      body="""    <h1>A service provider<br>needed <em>customers.</em></h1>
    <div class="card"><div class="who">Customer acquisition</div>
      <div class="q">&ldquo;Decision-maker appointments booked on a schedule, without
        adding sales headcount.&rdquo;</div></div>
    <div class="sub">Insurance, factoring, compliance, training &mdash; all of it sells
      into the same industry.</div>"""),
 dict(sect="03 / Who we help", bloom="bloom gold", extra_css=BIG,
      body="""    <h1>So &mdash; who do<br><em>you need to find?</em></h1>
    <div class="sub">Drivers, owner-operators, carriers, shippers or customers.
      Tell us which one and we will show you the install.</div>"""),
])

print("\ndone.")
