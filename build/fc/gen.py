#!/usr/bin/env python3
"""Emit every FleetConnect creative as standalone HTML.

No CTA URL is written into any creative on purpose: fleetconnect.pro has expired.
Insert the live domain in FOOT_R before these run. See fleetconnect/ART-DIRECTION.md
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FOOT_L = "FLEETCONNECT &nbsp;&middot;&nbsp; AI-ASSISTED CDL RECRUITING"
FOOT_R = "BOOK A FLEET REVIEW"          # ← add the live URL here once it exists

def page(name, *, body, status_l, status_r, foot_l=FOOT_L, foot_r=FOOT_R,
         lit=False, pips=None, swipe=None, extra_css="", pre=""):
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
<div class="canvas{' lit' if lit else ''}">
{pre}  <div class="mesh"></div>
  <div class="status">
    <div class="l"><span class="dot"></span><span>{status_l}</span></div>
    <div>{status_r}</div>
  </div>
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

page("FC01-ghost.html",
     status_l="LIVE &nbsp;&middot;&nbsp; INBOUND APPLICANT",
     status_r="09:14 &nbsp;&middot;&nbsp; QUEUE <b>6</b>",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:118px}
       .sub{margin-top:46px;max-width:800px;font-size:29px}
       .rule{height:1px;background:var(--hair);margin:46px 0 0}
     """,
     body="""    <h1>They didn&rsquo;t<br>ghost you.<br><em>Somebody<br>called first.</em></h1>
    <div class="rule"></div>
    <div class="sub">A driver applies to five carriers in one sitting, usually at night,
      and signs with whoever answers. Not the best offer. The first one.</div>""")

page("FC02-empty.html",
     status_l="UNIT 114 &nbsp;&middot;&nbsp; NO DRIVER ASSIGNED",
     status_r="DAY <b>19</b>",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:212px;letter-spacing:.012em;line-height:.9;
          -webkit-text-stroke:4px var(--alert);color:transparent}
       .sub{margin-top:34px;max-width:760px}
       .strip{margin-top:56px}
     """,
     body="""    <h1>EMPTY</h1>
    <div class="sub">A truck with nobody in it still makes a payment, still carries
      plates, still insures, still depreciates. It just doesn&rsquo;t earn.</div>
    <div class="strip">
      <div class="cell"><div class="v alert">19</div><div class="k">Days<br>parked</div></div>
      <div class="cell"><div class="v alert">0</div><div class="k">Loads<br>hauled</div></div>
      <div class="cell"><div class="v alert">0</div><div class="k">Costs<br>paused</div></div>
    </div>""")

page("FC03-0347.html",
     status_l="APPLICATION RECEIVED",
     status_r="SAT 03:47 &nbsp;&middot;&nbsp; UNANSWERED <b>04:13</b>",
     extra_css="""
       .body{justify-content:center}
       .kick{margin-bottom:22px}
       h1{font-size:236px;letter-spacing:-.05em;color:var(--live)}
       .sub{margin-top:30px;max-width:790px}
       .rows{margin-top:46px}
     """,
     body="""    <div class="kick">When your best applicant applied</div>
    <h1>03:47</h1>
    <div class="sub">Good drivers apply when they get off the road. That is almost never
      during your office hours.</div>
    <div class="rows">
      <div class="row"><span class="n">01</span><span class="t">He applies. Saturday, 3:47am.</span><span class="v live">ANSWERED</span></div>
      <div class="row"><span class="n">02</span><span class="t">Your recruiter opens the inbox. Monday, 8:00am.</span><span class="v alert">+52 HRS</span></div>
      <div class="row" style="border-bottom:none"><span class="n">03</span><span class="t">He started somewhere else. Monday, 6:00am.</span><span class="v alert">GONE</span></div>
    </div>""")

page("FC04-six-carriers.html",
     status_l="SAME APPLICANT &nbsp;&middot;&nbsp; SIX CARRIERS",
     status_r="RACE <b>CLOSED</b>",
     extra_css="""
       .body{justify-content:center}
       h1{font-size:88px;line-height:.98}
       .rows{margin-top:52px}
       .row .t{font-family:'JB',monospace;font-size:22px;letter-spacing:.02em}
       .row.win .t{color:var(--live)} .row.you .t{color:var(--alert)}
     """,
     body="""    <h1>He applied to six<br>carriers before lunch.<br><em>You were fourth<br>to call.</em></h1>
    <div class="rows">
      <div class="row win"><span class="n">1</span><span class="t">CARRIER B &mdash; called back</span><span class="v live">09:21</span></div>
      <div class="row"><span class="n">2</span><span class="t">CARRIER D &mdash; called back</span><span class="v">11:05</span></div>
      <div class="row"><span class="n">3</span><span class="t">CARRIER A &mdash; called back</span><span class="v">14:40</span></div>
      <div class="row you"><span class="n">4</span><span class="t">YOUR FLEET &mdash; called back</span><span class="v alert">16:30</span></div>
      <div class="row" style="border-bottom:none"><span class="n">&mdash;</span><span class="t">HE SIGNED WITH CARRIER B</span><span class="v live">12:00</span></div>
    </div>""")

page("FC05-seconds.html",
     status_l="RESPONSE LATENCY &nbsp;&middot;&nbsp; COMPARED",
     status_r="SAT 23:41",
     extra_css="""
       .body{justify-content:center}
       .body > *{flex:0 0 auto}
       .split{display:flex;gap:0;align-items:flex-start;border-top:1px solid var(--hair)}
       .half{min-width:0}
       .half{flex:1;padding:34px 0 30px}
       .half:first-child{border-right:1px solid var(--hair);padding-right:38px}
       .half:last-child{padding-left:38px}
       .half .lbl{font-family:'JB',monospace;font-size:12px;letter-spacing:.20em;
                  text-transform:uppercase;color:var(--dim);margin-bottom:20px}
       .half .big{font-family:'Outfit',sans-serif;font-weight:700;font-size:76px;
                  line-height:.9;letter-spacing:-.035em}
       .half.fast .big{color:var(--live)}
       .half.slow .big{color:var(--alert)}
       .half .note{margin-top:14px;font-family:'Instr',sans-serif;font-size:19px;
                   line-height:1.4;color:rgba(233,238,243,.62)}
       h1{font-size:66px;line-height:1.02}
       .tail{margin-top:auto;padding-top:26px;border-top:1px solid var(--hair);
             font-family:'Instr',sans-serif;font-size:22px;color:rgba(233,238,243,.70)}
     """,
     body="""    <h1>A driver applied<br>on Saturday night.</h1>
    <div class="split">
      <div class="half slow">
        <div class="lbl">Your inbox</div>
        <div class="big">Monday<br>8:00am</div>
        <div class="note">Fifty-six hours later. He is already in someone else&rsquo;s orientation.</div>
      </div>
      <div class="half fast">
        <div class="lbl">Answered in</div>
        <div class="big">Seconds</div>
        <div class="note">Text, voice or email, the moment the application lands &mdash; at 11:41 on a Saturday night.</div>
      </div>
    </div>
    <div class="tail">Recruiting is not a volume problem. It is a latency problem.</div>""")

page("FC06-offer.html",
     status_l="INTAKE OPEN",
     status_r="FLEETS <b>1&ndash;200</b> TRUCKS",
     extra_css="""
       .body{justify-content:flex-start;padding-top:14px}
       h1{font-size:96px;line-height:.94}
       .sub{margin-top:24px;max-width:820px;font-size:25px}
       .tiers{margin-top:auto}
       .tier{display:flex;gap:24px;align-items:flex-start;padding:26px 0;border-top:1px solid var(--hair)}
       .tier .ix{font-family:'JB',monospace;font-size:13px;letter-spacing:.14em;color:var(--live);
                 flex:0 0 44px;padding-top:7px}
       .tier .h{font-family:'Outfit',sans-serif;font-weight:700;font-size:32px;letter-spacing:-.024em}
       .tier .p{margin-top:7px;font-family:'Instr',sans-serif;font-size:20px;line-height:1.42;
                color:rgba(233,238,243,.62)}
     """,
     body="""    <h1>Fill the seat.<br><em>Then keep it filled.</em></h1>
    <div class="sub">Every applicant engaged the moment they apply. Qualified, nurtured
      and followed up. Only serious, pre-vetted drivers reach your desk.</div>
    <div class="tiers">
      <div class="tier"><div class="ix">01</div><div><div class="h">Emergency driver</div>
        <div class="p">One fully vetted CDL driver for a critical gap. When a seat cannot stay empty another week.</div></div></div>
      <div class="tier"><div class="ix">02</div><div><div class="h">Owner-operator recruitment</div>
        <div class="p">Verified owner-operators ready to lease on and run revenue immediately.</div></div></div>
      <div class="tier"><div class="ix">03</div><div><div class="h">Full recruiting system</div>
        <div class="p">An end-to-end hiring engine. A predictable, scalable flow of pre-qualified drivers.</div></div></div>
    </div>""")


# ══════════════════════════════════════════════════════════ CAROUSELS

def carousel(prefix, n, slides):
    for i, s in enumerate(slides, 1):
        page(f"{prefix}-{i:02d}.html", pips=(i, n),
             swipe="Swipe &rarr;" if i < n else "",
             **s)

# ---- C1 · THE RACE
BIG = ".body{justify-content:center} h1{font-size:104px} .sub{margin-top:40px;max-width:820px}"
STAMP = """.body{justify-content:center}
  .kick{margin-bottom:20px}
  .stamp{font-family:'Outfit',sans-serif;font-weight:700;font-size:210px;line-height:.86;letter-spacing:-.05em}
  .sub{margin-top:36px;max-width:800px}"""

carousel("C1", 6, [
 dict(status_l="THE RACE &nbsp;&middot;&nbsp; PART ONE", status_r="01 / 06", extra_css=BIG,
      body="""    <h1>A driver applied<br>to your fleet at<br><em>9:14 this morning.</em></h1>
    <div class="sub">You have not called him yet. Neither has anyone else. Right now it is a fair fight.</div>"""),
 dict(status_l="09:14 &rarr; 11:00", status_r="02 / 06", extra_css=STAMP,
      body="""    <div class="kick">By eleven o&rsquo;clock he had applied to</div>
    <div class="stamp" style="color:var(--ice)">5 more</div>
    <div class="sub">This is normal. Good drivers do not apply to one carrier. They apply to six and let the phone decide.</div>"""),
 dict(status_l="CARRIER B RESPONDED", status_r="03 / 06", extra_css=STAMP,
      body="""    <div class="kick">Carrier number two called him back at</div>
    <div class="stamp" style="color:var(--live)">09:21</div>
    <div class="sub">Seven minutes after he hit send. Not a better offer. Not a better fleet. Just first.</div>"""),
 dict(status_l="YOUR FLEET RESPONDED", status_r="04 / 06", extra_css=STAMP,
      body="""    <div class="kick">Your recruiter got to him at</div>
    <div class="stamp" style="color:var(--alert)">16:30</div>
    <div class="sub">Seven hours later. Nothing about your fleet had changed. Only the clock had.</div>"""),
 dict(status_l="OUTCOME", status_r="05 / 06", extra_css=BIG,
      body="""    <h1>He&rsquo;d already<br>signed.<br><em>At noon.</em></h1>
    <div class="sub">The truck he would have driven is still parked. It will still be parked next week.</div>"""),
 dict(status_l="THE POINT", status_r="06 / 06", extra_css=BIG + " h1{font-size:96px}",
      body="""    <h1>You didn&rsquo;t lose<br>a driver.<br><em>You lost a race.</em></h1>
    <div class="sub">FleetConnect answers every applicant in seconds &mdash; by text, voice or email,
      at 3am on a Saturday if that is when they apply.</div>"""),
])

# ---- C2 · WHAT AN EMPTY SEAT COSTS
LINE = """.body{justify-content:center}
  .kick{margin-bottom:18px}
  .item{font-family:'Outfit',sans-serif;font-weight:700;font-size:78px;line-height:.98;letter-spacing:-.032em}
  .amt{margin-top:34px;font-family:'Outfit',sans-serif;font-weight:700;font-size:120px;
       line-height:.9;letter-spacing:-.04em;color:var(--alert)}
  .per{margin-top:14px;font-family:'JB',monospace;font-size:13px;letter-spacing:.22em;
       text-transform:uppercase;color:var(--dim)}
  .sub{margin-top:40px;max-width:760px;font-size:24px}"""

carousel("C2", 6, [
 dict(status_l="COST OF AN EMPTY SEAT", status_r="01 / 06", extra_css=BIG,
      body="""    <h1>An empty truck<br>doesn&rsquo;t stop<br><em>costing money.</em></h1>
    <div class="sub">It stops earning. Those are not the same thing, and only one of them shows up
      on the schedule.</div>"""),
 dict(status_l="LINE ITEM 01", status_r="02 / 06", extra_css=LINE,
      body="""    <div class="kick">Line item 01</div>
    <div class="item">The payment.</div>
    <div class="amt">Due</div>
    <div class="per">Whether or not it moved this month</div>
    <div class="sub">The lender does not have a column for &ldquo;couldn&rsquo;t find a driver.&rdquo;</div>"""),
 dict(status_l="LINE ITEM 02", status_r="03 / 06", extra_css=LINE,
      body="""    <div class="kick">Line item 02</div>
    <div class="item">Plates, permits,<br>insurance.</div>
    <div class="amt">Paid</div>
    <div class="per">Annually, in advance, per unit</div>
    <div class="sub">All of it bought for a truck that is sitting in your yard.</div>"""),
 dict(status_l="LINE ITEM 03", status_r="04 / 06", extra_css=LINE,
      body="""    <div class="kick">Line item 03</div>
    <div class="item">The freight you<br>turned down.</div>
    <div class="amt">Gone</div>
    <div class="per">The largest number on this list</div>
    <div class="sub">And the only one your broker will remember next time they are handing out lanes.</div>"""),
 dict(status_l="TOTAL", status_r="05 / 06", extra_css=BIG + """
       h1{font-size:96px} .strip{margin-top:52px}""",
      body="""    <h1>Charged daily.<br><em>Never invoiced.</em></h1>
    <div class="strip">
      <div class="cell"><div class="v alert">19</div><div class="k">Average days<br>to fill a seat</div></div>
      <div class="cell"><div class="v alert">&times;</div><div class="k">Every cost above<br>still running</div></div>
      <div class="cell"><div class="v alert">&#8734;</div><div class="k">Times it repeats<br>per driver lost</div></div>
    </div>
    <div class="sub" style="margin-top:40px;font-size:22px">Illustrative &mdash; run the numbers against your own units.</div>"""),
 dict(status_l="THE FIX", status_r="06 / 06", extra_css=BIG,
      body="""    <h1>The fastest way<br>to cut that bill<br><em>is to answer faster.</em></h1>
    <div class="sub">Every applicant engaged the second they apply. Qualified, nurtured,
      and handed to you only when they are serious.</div>"""),
])

# ---- C3 · FOUR REASONS
REASON = """.body{justify-content:center}
  .num{font-family:'Outfit',sans-serif;font-weight:700;font-size:150px;line-height:.82;
       letter-spacing:-.05em;color:var(--live);margin-bottom:26px}
  h1{font-size:76px;line-height:1.0}
  .sub{margin-top:34px;max-width:800px;font-size:25px}"""

carousel("C3", 6, [
 dict(status_l="DIAGNOSTIC", status_r="01 / 06", extra_css=BIG,
      body="""    <h1>Four reasons<br>your trucks are<br><em>still empty.</em></h1>
    <div class="sub">None of them is that there aren&rsquo;t enough drivers.</div>"""),
 dict(status_l="REASON 01", status_r="02 / 06", extra_css=REASON,
      body="""    <div class="num">01</div>
    <h1>You&rsquo;re not slow.<br>You&rsquo;re slower than<br>whoever called first.</h1>
    <div class="sub">Four hours feels responsive to you. It is fourth place to him.</div>"""),
 dict(status_l="REASON 02", status_r="03 / 06", extra_css=REASON,
      body="""    <div class="num">02</div>
    <h1>Your best applicants<br>apply at 11pm.<br>You open at eight.</h1>
    <div class="sub">Drivers apply when they shut down for the night. Your coverage
      is the exact inverse of their behaviour.</div>"""),
 dict(status_l="REASON 03", status_r="04 / 06", extra_css=REASON,
      body="""    <div class="num">03</div>
    <h1>You pay for leads,<br>then let them<br>go cold.</h1>
    <div class="sub">The spend was never the problem. The forty-eight hours after
      the spend is the problem.</div>"""),
 dict(status_l="REASON 04", status_r="05 / 06", extra_css=REASON,
      body="""    <div class="num">04</div>
    <h1>Everyone works<br>the same twenty names.</h1>
    <div class="sub">Nobody works the other hundred and eighty. Those are not bad leads.
      They are unworked ones.</div>"""),
 dict(status_l="ALL FOUR", status_r="06 / 06", extra_css=BIG,
      body="""    <h1>All four are<br>the same problem.<br><em>Nobody answered.</em></h1>
    <div class="sub">FleetConnect answers every applicant in seconds, works the whole
      list instead of the top of it, and only hands you the ones worth your time.</div>"""),
])

print("\ndone.")
