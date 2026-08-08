import assert from "node:assert/strict";
import {
  generateOldSeaDogsPressArticle,
  previewPressReleaseCleaning,
} from "../lib/press-release-utils";

const junkExamples = [
  "View this email in your browser (https://mailchi.mp/49e8d7dfcf33/roadtovendeeglobe-imoca-18166168?e�11bc5bc3)",
  "https://www.imoca.org/en MAY 29",
  "�e �e",
  "https://tidecut.com/share/4a7ee28d-6a3b-446b-903f-50688b37e3fc CLICK ON THE IMAGE TO DOWNLOAD IT (https://tidecut.com/share/4a7ee28d-6a3b-446b-903f-50688b37e3fc)",
  "� Maxime Horlaville / disobey /",
];

const usefulPressText = `
The IMOCA fleet will return to the North Atlantic in May 2027 with a fully crewed offshore race from Lorient to New York.
Organisers confirmed that twenty-one boats have registered for the 3,200 nautical mile course, including several teams preparing for the next Vendee Globe cycle.
The start is scheduled for 29 May from Lorient, with the fleet expected to reach New York after ten to fourteen days at sea depending on the weather.
Charlie Dalin, Sam Goodchild and Justine Mettraux are among the skippers listed on the early entry sheet.
The race will count towards the class championship and will give new foiling boats a hard Atlantic test before the summer refit period.
Lorient La Base will host the race village during the week before the start, with technical checks, safety inspections and public pontoon access planned for the teams.
The first tactical hurdle will be the Bay of Biscay, where spring depressions can turn a clean exit into a long night of reefs and wet boots.
After that, the crews face the usual Atlantic choice between a northern route with stronger breeze and a southern lane that may offer a kinder sea state.
Race directors said the finish line will be set off the entrance to New York Harbour, giving the class a rare chance to put modern ocean racing in front of a large city audience.
For the teams, the crossing is more than a delivery with flags on it: it is a live test of sail inventories, foil reliability, watch systems and crew rhythm.
Several shore crews are expected to use the American stopover for repair work before the boats return to Europe for the next stage of the season.
The event also gives sponsors and clubs a public story to follow, with daily rankings, weather files and onboard reports due throughout the passage.
The Notice of Race sets a crewed format, so the boats will carry full watch systems rather than the single-handed routines used in the Vendee Globe.
That changes the rhythm on board, with faster sail changes, more aggressive trimming and less tolerance for gear that has been nursed through a solo campaign.
The course also puts navigation teams under proper pressure because the Gulf Stream can hand out quick gains to crews who read the water and ugly losses to those who miss the meanders.
Lorient has become one of the class's busiest technical bases, with designers, riggers, foil specialists and electronics teams all within reach of the pontoons.
New York gives the race a different finish from the usual French Atlantic circuit and should put the boats in front of yacht clubs, sponsors and offshore followers on the American side.
Organisers said the race office will publish daily rankings, weather summaries and onboard media during the crossing.
Class measurers will complete stability, safety and communications checks before the fleet leaves Lorient.
Teams are also expected to carry emergency steering gear, storm sails, medical kits and satellite tracking equipment for the Atlantic passage.
The May start window was chosen to avoid the worst of the winter lows while still giving the fleet meaningful weather rather than a soft delivery run.
For newer crews, the race will be a useful rehearsal for managing sleep, food, repairs and watch handovers at IMOCA speeds.
For the established teams, it is a chance to compare boat speed against rivals before the next round of design work begins.
`;

const input = `${junkExamples.join("\n")}\n\n${usefulPressText}\n\nUnsubscribe\nPowered by Mailchimp`;
const preview = previewPressReleaseCleaning(input);

for (const forbidden of [
  "View this email in your browser",
  "mailchi.mp",
  "https://www.imoca.org/en",
  "tidecut.com",
  "CLICK ON THE IMAGE TO DOWNLOAD IT",
  "�",
  "�e",
]) {
  assert.equal(preview.cleanedText.includes(forbidden), false, `${forbidden} was not removed from cleaned text`);
}

assert.ok(
  preview.extractedPhotoCredits.some((credit) => credit.includes("Maxime Horlaville / disobey")),
  "Photo credit was not extracted"
);
assert.ok(preview.removedBoilerplateCount >= 3, "Boilerplate lines were not counted");
assert.ok(preview.removedUrlCount >= 3, "Raw URLs were not counted");
assert.ok(preview.removedBrokenCharacterCount >= 1, "Broken characters were not counted");

const generated = generateOldSeaDogsPressArticle({
  subject: "IMOCA fleet sets course for New York in 2027 Atlantic race",
  bodyText: input,
  category: "Races",
});
const finalArticle = [generated.title, generated.excerpt, ...generated.body].join("\n");

assert.equal(generated.status, "ready", "The cleaned source should be detailed enough to generate an article");
for (const forbidden of [
  "View this email in your browser",
  "mailchi.mp",
  "https://www.imoca.org/en",
  "tidecut.com",
  "CLICK ON THE IMAGE TO DOWNLOAD IT",
  "Maxime Horlaville / disobey",
  "�",
]) {
  assert.equal(finalArticle.includes(forbidden), false, `${forbidden} reached the generated article`);
}

console.log("Press-release cleaning check passed.");
