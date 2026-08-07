export interface DefaultQuestion {
  text: string;
  options: string[];
}

/**
 * 16 default spørgsmål, klar til brug. Værten kan redigere dem alle
 * (tekst og svarmuligheder) i lobbyen inden spillet starter.
 */
export const DEFAULT_QUESTIONS: DefaultQuestion[] = [
  {
    text: "Hvad er Katrines yndlingsmad?",
    options: ["Pizza", "Sushi", "Tacos", "Boller i karry"],
  },
  {
    text: "Hvor ville Katrine helst rejse hen?",
    options: ["Japan", "Italien", "New York", "Bali"],
  },
  {
    text: "Hvad ville Katrine vælge som superkraft?",
    options: ["Flyve", "Usynlighed", "Tidsrejser", "Læse tanker"],
  },
  {
    text: "Hvilket dyr minder mest om Katrine?",
    options: ["Ræv", "Kat", "Hund", "Ugle"],
  },
  {
    text: "Hvad bruger Katrine mest tid på i weekenden?",
    options: ["Sove", "Sport", "Fester", "Netflix"],
  },
  {
    text: "Hvad ville Katrine bruge en million kroner på?",
    options: ["Rejser", "Bolig", "Fest for vennerne", "Investere det hele"],
  },
  {
    text: "Hvilken film-genre foretrækker Katrine?",
    options: ["Komedie", "Gyser", "Romantik", "Action"],
  },
  {
    text: "Hvad er Katrines værste vane?",
    options: ["Kommer for sent", "Glemmer navne", "Snorker", "Er evigt på telefonen"],
  },
  {
    text: "Hvad ville Katrine gøre på en fridag uden planer?",
    options: ["Blive i sengen", "Gå en tur", "Bage", "Møde venner"],
  },
  {
    text: "Hvilken drink vælger Katrine til en fest?",
    options: ["Gin & tonic", "Rødvin", "Øl", "Sodavand"],
  },
  {
    text: "Hvilken sport gik Katrine til som barn, og var god til?",
    options: ["Svømning", "Gymnastik", "Fodbold", "Ballet"],
  },
  {
    text: "Hvad gør Katrine, når hun skal slappe af?",
    options: ["Spiller guitar", "Maler", "Løber", "Mediterer"],
  },
  {
    text: "Hvem tager Katrine oftest med på skiferie?",
    options: ["Ellen", "Laurids", "Sin mor", "Hele vennegruppen"],
  },
  {
    text: "Hvad foretrækker Katrine på pistesne?",
    options: ["Snowboard", "Ski", "Slæde", "Skihytten med kakao"],
  },
  {
    text: "Hvilken tid ville Katrine bedst kunne tænke sig at have levet i?",
    options: ["En tid uden smartphones", "Middelalderen", "1920'erne", "Fremtiden om 100 år"],
  },
  {
    text: "Hvad er Katrines bedste koncert-souvenir?",
    options: [
      "En plekter fra Minds of 99-guitaristen",
      "En signeret t-shirt",
      "Et sætlist fra scenen",
      "Et billede med bandet",
    ],
  },
];
