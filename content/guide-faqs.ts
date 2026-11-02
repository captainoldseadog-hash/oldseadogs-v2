/**
 * Guide FAQs (SEO pack 28 Oct 2026). Rendered as an on-page FAQ section and FAQPage JSON-LD.
 * Copy needs Michael's review before go-live.
 */
export type GuideFaq = { question: string; answer: string };

export const guideFaqs: Record<string, readonly GuideFaq[]> = {
  "dartmouth": [
    {
      "question": "What VHF channel do I call for Dartmouth?",
      "answer": "Call Dartnav on VHF Channel 11 for berthing instructions before you commit to a pontoon or buoy. Private marinas (Darthaven; Dart Marina / Premier Dartmouth) commonly use Channel 80 once Dartnav has cleared your intentions."
    },
    {
      "question": "Can I book a visitor berth in advance?",
      "answer": "Yes — for 2026. Dart Harbour Authority lets visitors pre-book a limited number of berths up to two weeks ahead on the Dart Harbour visitors page. Exact mooring is still decided on the day. The harbour says it still has space when online slots show full and that they never turn anyone away. Arrive after 19:00 only if you have told the office, or the berth may not be held."
    },
    {
      "question": "What are the online booking draught limits?",
      "answer": "Online booking windows only: Inside Town Jetty 1.8 m, DA Pontoon 2 m. Confirm the berth and approach with Dartnav or the marina. Commercial, sail-training, multihull, large and deep-draught vessels should not book online — call the harbour office on 01803 832337."
    },
    {
      "question": "How much does overnight visitor berthing cost?",
      "answer": "Mooring fees are per metre per night, and harbour dues are extra. Confirm the current DHNA charges schedule rather than an old figure."
    },
    {
      "question": "Can I anchor in Dartmouth harbour?",
      "answer": "Visitor berthing is on DHNA pontoons and buoys or private marinas — not a free-for-all anchorage guide. Follow Dartnav’s placement. White visitor buoys upriver (e.g. Dittisham) are a different, bookable overnight option via the same visitors page."
    },
    {
      "question": "Town Jetty or DA — what’s the difference?",
      "answer": "Inside Town Jetty is walk-ashore town centre, with water and electricity included (online booking typically 8–18 m). DA Pontoon is walk-ashore on the North Embankment; water and electricity are not included on the DA line (online typically 5–14 m). Deep Water island pontoons and Mainstream buoys are not walk-ashore. ---"
    }
  ],
  "port-solent-marina": [
    {
      "question": "How do I get into Port Solent?",
      "answer": "In stages: Portsmouth Harbour entrance (keep to the Small Boat Channel if under 20 m), through the inner harbour, then the marina lock. Call Port Solent on VHF Channel 80 for lock instructions. Harbour traffic: Portsmouth VTS Channel 11."
    },
    {
      "question": "Is the lock 24 hours?",
      "answer": "Reception and lock operation are published around the clock (24 hours). Do not confuse that with unrestricted entry — you still need confirmed suitability and an allocated berth, and current lock directions."
    },
    {
      "question": "What telephone number should I use?",
      "answer": "Marina telephone on the guide: 023 9221 0765. Confirm berthing before you rely on a spontaneous arrival."
    },
    {
      "question": "Is Port Solent a quick open-water stop?",
      "answer": "No. The guide’s “less good for” list includes a quick open-water stop or an unplanned arrival without harbour and lock preparation. It suits sheltered stays and crews who want the waterside leisure development once inside."
    },
    {
      "question": "Are berth counts and depth limits published on Old Sea Dogs?",
      "answer": "Not in the current dataset — berth count and dimensional limits are not stated in the supplied record. Confirm vessel suitability directly with the marina."
    }
  ],
  "st-peter-port": [
    {
      "question": "What VHF channels do I need?",
      "answer": "Listen to Guernsey VTS on Channel 12 and obey IALA port traffic signals. Then call Victoria Marina on Channel 80. Vessels of 20 metres or more must join the VTS scheme."
    },
    {
      "question": "Can I enter Victoria Marina at any tide?",
      "answer": "No. Victoria Marina has a sill 4.2 metres above chart datum, giving access about 2½ hours either side of high water. Entry is controlled by attendants (lights on both pier heads). If the sill isn’t open, wait on the holding pontoon or use the all-tide Swan pontoons outside (water, no electricity)."
    },
    {
      "question": "What customs / Q-flag steps apply?",
      "answer": "St Peter Port is an approved port of entry. Fly the Q flag and, before anyone goes ashore, complete the GC27 declaration the marina staff give you and post the white copy in a yellow Customs box. Leaving Great Britain for the Channel Islands counts as leaving the UK for customs purposes — submit a pleasure craft report to Border Force/HMRC before you sail, and report again on return."
    },
    {
      "question": "Are the Swan pontoons tide-restricted?",
      "answer": "No — the Swan pontoons just outside Victoria Marina are not restricted by the tide and give walk-ashore access to town, with water but no electricity."
    },
    {
      "question": "How long can I stay / leave the boat?",
      "answer": "Tell staff how long you plan to stay. You need permission to leave the boat unattended for more than 24 hours, or to stay longer than 14 days. QEII Marina is by prior arrangement only."
    }
  ],
  "studland-bay": [
    {
      "question": "Can I still anchor in Studland Bay?",
      "answer": "Inside the Voluntary No Anchoring Zone (yellow buoys in season, off South and Middle beaches), pick up an eco-mooring rather than anchoring. Outside the zone, anchoring remains possible, but the MMO asks boaters to avoid seagrass and use an eco-mooring where available. Safety of life at sea comes first: anchoring in an emergency is unaffected."
    },
    {
      "question": "How much do the eco-moorings cost (2026)?",
      "answer": "£7.50 up to 4 hours; £15 up to 24 hours; £150 seasonal pass. Pay on arrival. Check the weight-limit band on the block (blue 5 tonnes, yellow 10 tonnes), use the pick-up line, and do not raft."
    },
    {
      "question": "What VHF should I listen to nearby?",
      "answer": "Poole VTS, Channel 14 (formerly Poole Harbour Control) for the harbour approaches nearby. Studland itself is an anchorage/mooring stop, not a harbour with its own visitor berthing channel on the guide."
    },
    {
      "question": "When are the no-anchor and eco-mooring buoys out?",
      "answer": "Expect the seasonal buoys from April: yellow markers for the no-anchor zone and speed limit, and white eco-mooring buoys within it. Plan with current charts and Poole Harbour Commissioners’ Local Notices."
    },
    {
      "question": "Is Studland good for an overnight?",
      "answer": "Yes in settled weather on an eco-mooring. Leave if the swell builds above about a metre (per guide advice). It is a classic lunch stop or settled-weather night just outside Poole — not a heavy-weather bolt-hole."
    }
  ],
  "weymouth-harbour": [
    {
      "question": "What VHF channel is Weymouth Harbour?",
      "answer": "Channel 12, call sign “Weymouth Harbour”. Call for berthing advice before entering. Obey pierhead traffic signals and Town Bridge lights — they are separate."
    },
    {
      "question": "How do I book a visitor berth?",
      "answer": "Most visitors lie alongside floating pontoons with gangways ashore (Custom House Quay). Book overnight berths online; short stays up to 2 hours by phone/VHF. Harbour telephone: 01305 838423. Larger craft (over 18 m) should give advance notice."
    },
    {
      "question": "What about the Town Bridge / bascule bridge?",
      "answer": "There is a bascule bridge with charted vertical clearance 2.75 m (Weymouth Harbour Local Notice to Mariners 02/2026). Lift timetable is published by the harbour. Listen on Ch 12 at least five minutes before a scheduled lift and be in sight of the operator. In winter, at least one hour’s notice is required for every lift. Check with the harbour office before arrival."
    },
    {
      "question": "Is this the same as Weymouth Marina or Portland Marina?",
      "answer": "No. This page is the council harbour / Custom House Quay visitor berthing. Weymouth Marina (inside the lifting bridge) and Portland Marina are separate Old Sea Dogs guides under Weymouth & Portland."
    },
    {
      "question": "Can I raft up?",
      "answer": "Yes — the guide frames arrival as rafting on council pontoons along Custom House Quay when directed / as per harbour practice. Follow harbour instructions on Ch 12; in silent hours follow the harbour’s berthing map or raft on a similar-sized vessel as directed."
    }
  ],
  "wroxham-hoveton": [{"question": "Can I take my boat under Wroxham Bridge?", "answer": "Only if your air draught clears the gauge — it is 2.18 m at average high water. Hire cruisers must use the Norfolk Broads Direct pilot (07775 297638, £15, 08:30–17:00, 28 March to the end of October 2026)."}, {"question": "Where can I moor for free at Wroxham?", "answer": "The Broads Authority 24-hour moorings at Hoveton Viaduct (315 m) and Hoveton St John (61 m, stern-on) are free. Boatyard berths are charged — ask the yard."}, {"question": "Can I stop on Wroxham Broad?", "answer": "No. Wroxham Broad is privately owned. You may cruise across it but not moor or anchor."}],
  "horning": [{"question": "Where can I moor at Horning?", "answer": "Free Broads Authority 24-hour moorings at Horning Parish Staithe (69 m) and Horning Marshes (227 m), plus pub moorings at the Swan, New Inn and Ferry Inn, and Ferry Marina (01692 631111)."}, {"question": "Is there water at Horning?", "answer": "Yes — Horning Marshes moorings have water and an electric charging point. Boatyards have more facilities."}, {"question": "Are there bridges at Horning?", "answer": "No. The nearest low bridges are Wroxham upstream and Ludham Bridge on the Ant."}],
  "ranworth": [{"question": "How much does it cost to moor at Ranworth?", "answer": "Ranworth Staithe charges £6 for the day and £12 overnight from April to October, and £4 for the dinghy dyke (Broads Authority). Staithe phone: 01603 756094."}, {"question": "Can I take a boat onto Ranworth Broad?", "answer": "No. Ranworth Broad is a Norfolk Wildlife Trust nature reserve. Moor at the staithe on Malthouse Broad and walk the boardwalk."}, {"question": "Can I climb Ranworth church tower?", "answer": "Yes — St Helen’s tower has 89 steps and two ladders. Check opening with the church."}],
  "how-hill-ludham": [{"question": "Is mooring free at How Hill?", "answer": "Yes. How Hill has 286 m of free Broads Authority 24-hour mooring on the River Ant."}, {"question": "Where do I moor for Ludham village?", "answer": "Womack Staithe at the head of Womack Water, off the Thurne. It is free until 5pm and charged overnight. Womack Island and the BA Womack Dyke mooring are alternatives."}, {"question": "How high is Ludham Bridge?", "answer": "2.60 m at average high water (Broads Authority bridge table). Clearance is less on a big tide."}],
  "stalham": [{"question": "Where can I moor in Stalham?", "answer": "Stalham Staithe has 46 m of free Broads Authority 24-hour mooring beside the Museum of the Broads. The museum has visitor moorings (report to reception), and Richardsons yard is the usual back-up."}, {"question": "Is there a supermarket near Stalham Staithe?", "answer": "Yes, a Tesco about five minutes’ walk from the moorings, with a cash machine."}, {"question": "Are there low bridges on the way to Stalham?", "answer": "Ludham Bridge on the Ant is 2.60 m at average high water. There is no low bridge between Barton Broad and Stalham."}],
  "hickling": [{"question": "Can a hire cruiser get to Hickling Broad?", "answer": "Only if it clears Potter Heigham Old Bridge (1.94 m at average high water), and then only with the Phoenix Fleet pilot (01692 670460). Many hire cruisers cannot pass."}, {"question": "Where do I moor at Hickling?", "answer": "The Pleasure Boat Inn has free moorings for customers for up to 48 hours. Broads Authority moorings at Deep Dyke, Deep Go Dyke and White Slea are nearby — check the BA moorings map."}, {"question": "Is Hickling Broad deep?", "answer": "No. It is shallow outside the marked channel. Keep to the posts."}],
  "potter-heigham": [{"question": "How low is Potter Heigham bridge?", "answer": "The Old Bridge gives 1.94 m at average high water and the New (road) Bridge 2.32 m (Broads Authority). Always read the gauge boards on the day."}, {"question": "Is there a pilot for Potter Heigham bridge?", "answer": "Yes — Phoenix Fleet, 01692 670460: £10 one way or £15 return."}, {"question": "Where can I moor at Potter Heigham?", "answer": "Free Broads Authority 24-hour moorings on Repps Bank (149 m) and Martham Bank (146 m), short-stay at Bridge Green and the Staithe, and Herbert Woods yard (01692 670711)."}],
  "acle": [{"question": "Is mooring free at Acle Bridge?", "answer": "The Broads Authority mooring (166 m) is free for 24 hours. The Acle Bridge Inn moorings are free by day and £12.50 a night from 5pm."}, {"question": "How high is Acle Bridge?", "answer": "3.68 m at average high water (Broads Authority)."}, {"question": "Is Acle tidal?", "answer": "Yes. HW is about 3 h 30 min after Gorleston, and the stream runs noticeably. Moor against the current."}],
  "great-yarmouth": [{"question": "How much does Great Yarmouth Yacht Station cost?", "answer": "Broads Authority charges are £8 for the day and £18 overnight. Phone 01493 842794 or 07766 398238."}, {"question": "When should I cross Breydon Water?", "answer": "Plan around slack water using the Broads Authority Gorleston tide table — HW at Yarmouth Yacht Station is about one hour after Gorleston. Keep to the marked channel."}, {"question": "How do I get Breydon Bridge lifted?", "answer": "Contact Peel Ports on 01493 651275, VHF Channel 12 or greatyarmouthbreydon.bridge@peelports.com. Book weekend lifts by 16:00 on Friday."}],
  "reedham": [{"question": "How much does it cost to moor at Reedham Quay?", "answer": "The Broads Authority charges £6 for the day and £12 overnight, with a 24-hour maximum stay. Phone 01493 701867 or 07733 102566."}, {"question": "How do I get Reedham swing bridge opened?", "answer": "Call on VHF Channel 12 or phone 0330 858 4655. Closed, it gives 3.16 m at average high water, and trains have priority."}, {"question": "Is the tide strong at Reedham?", "answer": "Yes. HW is about 2 h 30 min after Gorleston, and the Yare runs hard past the quay. Moor into the stream and let the quay staff help."}],
  "brundall": [{"question": "Where can I moor for free at Brundall?", "answer": "Brundall Church Fen has 35 m of free Broads Authority 24-hour mooring. DP16 moorings are listed at Brundall Gardens, Eastwood and Swancraft."}, {"question": "Are there shops in Brundall?", "answer": "Yes — two Co-op supermarkets and other shops in the village centre, across the railway line from the river."}, {"question": "How far is Strumpshaw Fen from Brundall?", "answer": "About 1.4 miles to the RSPB reserve."}],
  "norwich": [{"question": "How much does Norwich Yacht Station cost?", "answer": "The Broads Authority charges £8 for the day and £18 overnight. Phone 01603 612980 or 07747 065378."}, {"question": "What bridges are there into Norwich?", "answer": "Carrow (4.16 m), Novi Sad (4.90 m) and Lady Julian (3.87 m) below the yacht station, all at average high water. Carrow lifts go through Broads Control on 01603 756056 with at least 24 hours’ notice."}, {"question": "Can I moor at Norwich in winter?", "answer": "No. Mooring is prohibited at the yacht station when it is closed outside the main season."}],
  "beccles": [{"question": "Where can I moor in Beccles?", "answer": "At Beccles Yacht Station on the Quay (privately managed, charged — book ahead in school holidays) or the free Broads Authority 24-hour moorings on North Bank (20 m) and South Bank (58 m)."}, {"question": "Can I get under Beccles Old Bridge?", "answer": "Only if your air draught is under 2.02 m at average high water. Otherwise take the seasonal Big Dog Ferry to Geldeston."}, {"question": "Does Beccles Yacht Station have showers?", "answer": "Yes — toilets, showers, laundry and electric hook-up."}],
  "oulton-broad": [{"question": "How do I get from Lowestoft into the Broads?", "answer": "Call ABP Lowestoft Harbour Control on VHF 14, then Mutford Lock on VHF 73 or 01502 531778. The lock opens 08:00–18:00 April to October and 08:00–12:00 November to March, and charges £17 a day."}, {"question": "How do I contact Oulton Broad Yacht Station?", "answer": "Phone 01502 574946 or call on VHF Channel 73."}, {"question": "Do I need a Broads toll for Oulton Broad?", "answer": "Yes, if you cruise beyond a brief Oulton Broad stay. Short-visit tolls are on the Broads Authority site."}],
  "norfolk-broads": [{"question": "Do I need a toll to cruise the Broads?", "answer": "Yes. Visitors can buy a short-visit toll for up to 28 days in a toll year — for 2026/27 an 8 m motor cruiser is £65.35 for 1–7 days. Contact the Broads Authority tolls team on 01603 756080."}, {"question": "What is the speed limit on the Broads?", "answer": "3 to 6 mph over the ground depending on the stretch, signed on the banks."}, {"question": "How do I cross Breydon Water?", "answer": "Around slack water, using the Broads Authority tide table for Gorleston and its inland differences. Keep to the marked channel — Breydon dries outside the posts."}, {"question": "What is the lowest bridge on the Broads?", "answer": "Potter Heigham Old Bridge, at 1.94 m at average high water. Phoenix Fleet runs a pilot service on 01692 670460."}],
};

export function guideFaqsFor(slug: string): readonly GuideFaq[] {
  return guideFaqs[slug] ?? [];
}
