/* TBE: Random Event — roll a full event on demand (focus + two randomizer words). */
const e = await TBE.event();
await TBE.say(TBE.card("Random Event", TBE.eventHtml(e)));
