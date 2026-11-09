// Long-form text for the About and Contact pages. English and Somali are
// written out; other languages show English until translated.
//
// REVIEW: Munira, please check every statement about ISLAAH Media and about
// yourself, and add your own background. Somali is a draft translation.
import type { Lang } from '../i18n';

export interface AboutContent {
  title: string;
  lead: string;
  missionTitle: string;
  mission: string[];
  visionTitle: string;
  vision: string;
  journalistTitle: string;
  journalistName: string;
  journalistRole: string;
  journalistBio: string[];
  principlesTitle: string;
  principles: { title: string; body: string }[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
}

export interface ContactContent {
  title: string;
  lead: string;
  whyTitle: string;
  why: string[];
  promisesTitle: string;
  promises: { title: string; body: string }[];
  channelsTitle: string;
  channelsIntro: string;
  signalLabel: string;
  storiesEmailLabel: string;
  generalEmailLabel: string;
  noChannels: string;
  safetyTitle: string;
  safety: string[];
  dangerTitle: string;
  danger: string;
}

const ABOUT: Partial<Record<Lang, AboutContent>> = {
  EN: {
    title: 'About ISLAAH',
    lead: 'Islaah (الإصلاح) means reform and reconciliation. ISLAAH Media is an investigative audio-journalism platform that records the testimonies of young people who have left extremist armed groups in Kenya, Somalia, Tanzania, the DRC and Mozambique.',
    missionTitle: 'Our mission',
    mission: [
      'To expose the lies, false hopes and manipulation that extremist groups use to recruit vulnerable young people.',
      'To document, honestly and without sensationalism, the fear and hardship of life inside those groups.',
      'To show that leaving is possible, and to follow the long road of those who come home and rebuild peaceful lives.',
    ],
    visionTitle: 'Our vision',
    vision:
      'A region where young people can recognise the recruiter’s promise for what it is before it is too late, and where those who leave are met with justice, care and a way back into their communities.',
    journalistTitle: 'Our journalist',
    journalistName: 'Munira Zubeir',
    journalistRole: 'Investigative journalist, ISLAAH Media',
    journalistBio: [
      'Munira Zubeir is an investigative journalist working with ISLAAH Media. She leads ISLAAH’s reporting: finding, interviewing and protecting the young people whose stories appear on this site.',
      'Her work follows each story from the first promise of the recruiter, through life inside the group, to the moment of escape and the slow work of returning home.',
    ],
    principlesTitle: 'How we work',
    principles: [
      { title: 'Consent first', body: 'Nobody is recorded or published without their informed agreement, and anyone can withdraw their story.' },
      { title: 'No faces, no names', body: 'We never show faces or publish names, and we remove details that could identify a person or their family.' },
      { title: 'Voices protected', body: 'Testimonies are re-voiced by a narrator, so no contributor’s real voice is ever published.' },
      { title: 'Verified and fair', body: 'We check what we can with independent sources, and we report without glorifying violence or the groups behind it.' },
    ],
    ctaTitle: 'Have a story to tell?',
    ctaBody: 'If you, or someone close to you, has left an armed group, your story could stop another young person from being deceived.',
    ctaButton: 'Share your story safely',
  },
  SO: {
    title: 'Ku saabsan ISLAAH',
    lead: 'Islaax (الإصلاح) macnaheedu waa dib-u-habayn iyo dib-u-heshiisiin. ISLAAH Media waa madal saxaafadeed oo baadhis cod ah, oo duubta markhaatiyada dhallinyarada ka soo baxay kooxaha xagjirka ah ee hubaysan ee Kenya, Soomaaliya, Tanzania, DRC iyo Mozambique.',
    missionTitle: 'Hadafkeenna',
    mission: [
      'In aan soo bandhigno beenta, rajada been abuurka ah iyo khiyaanada ay kooxaha xagjirka ahi u adeegsadaan qorista dhallinyarada nugul.',
      'In aan diiwaangelinno, si daacad ah oo aan buunbuunin lahayn, cabsida iyo dhibaatada nolosha kooxahaas gudahooda.',
      'In aan muujinno in ka bixiddu suurtagal tahay, oo aan raacno jidka dheer ee kuwa guriga ku soo noqda oo dib u dhisa nolol nabadeed.',
    ],
    visionTitle: 'Aragtideenna',
    vision:
      'Gobol ay dhallinyaradu garan karaan ballanta qoraha waxa ay dhab ahaan tahay ka hor intaanay goor dambe noqon, oo kuwa ka soo baxa lagu soo dhaweeyo cadaalad, daryeel iyo jid ay ugu soo noqdaan bulshadooda.',
    journalistTitle: 'Wariyaheenna',
    journalistName: 'Munira Zubeir',
    journalistRole: 'Wariye baadhis, ISLAAH Media',
    journalistBio: [
      'Munira Zubeir waa wariye baadhis oo la shaqaysa ISLAAH Media. Waxay hoggaamisaa warbixinaha ISLAAH: helidda, wareysiga iyo ilaalinta dhallinyarada sheekooyinkoodu ka muuqdaan boggan.',
      'Shaqadeedu waxay raacdaa sheeko kasta laga bilaabo ballanta ugu horreysa ee qoraha, nolosha kooxda gudaheeda, ilaa waqtiga baxsashada iyo shaqada tartiibka ah ee guriga loogu soo noqdo.',
    ],
    principlesTitle: 'Sida aan u shaqayno',
    principles: [
      { title: 'Oggolaansho marka hore', body: 'Qofna lama duubo lamana daabaco oggolaanshihiisa la’aanteed, qof kastana wuu ka noqon karaa sheekadiisa.' },
      { title: 'Waji iyo magac midna', body: 'Marna ma muujinno wejiyo, mana daabacno magacyo, waxaanan ka saarnaa faahfaahin kasta oo lagu garan karo qof ama qoyskiisa.' },
      { title: 'Codadka waa la ilaaliyaa', body: 'Markhaatiyada waxaa dib u akhriya akhriye, sidaa darteed codka dhabta ah ee qofna marna lama daabaco.' },
      { title: 'La xaqiijiyay oo cadaalad ah', body: 'Waxaan hubinnaa wixii aan awoodno ilo madax-bannaan, waxaanan wax ka sheegnaa annagoon ammaanin rabshadaha ama kooxaha ka dambeeya.' },
    ],
    ctaTitle: 'Ma haysaa sheeko aad sheegto?',
    ctaBody: 'Haddii adiga, ama qof kuu dhow, uu ka soo baxay koox hubaysan, sheekadaadu waxay joojin kartaa in dhallinyaro kale la khiyaameeyo.',
    ctaButton: 'Si ammaan ah u wadaag sheekadaada',
  },
};

const CONTACT_PAGE: Partial<Record<Lang, ContactContent>> = {
  EN: {
    title: 'Share your story',
    lead: 'If you have left an armed group, or someone in your family has, your story matters. Told safely, it can warn another young person before the recruiter reaches them.',
    whyTitle: 'Why your voice matters',
    why: [
      'Recruiters rely on silence. Every honest account of what really happens inside these groups makes their promises harder to believe.',
      'Your story can also help families, teachers and community elders recognise the warning signs, and show others who want to leave that a way home exists.',
    ],
    promisesTitle: 'Our promises to you',
    promises: [
      { title: 'Your identity stays hidden', body: 'We never publish your name, face or voice. A narrator reads your words, and we change details that could identify you.' },
      { title: 'You stay in control', body: 'You decide what to share. You can stop at any time, and nothing is published until you have agreed to it.' },
      { title: 'No pressure, no payment', body: 'We will never pressure you to talk, and we do not pay for stories, so no one can say you were bought.' },
      { title: 'Care comes first', body: 'If you need support, we can point you to trusted counselling and reintegration programmes, whether or not you share your story.' },
    ],
    channelsTitle: 'How to reach us safely',
    channelsIntro: 'Use an encrypted channel if you can. Start with a short message; you do not need to give your name.',
    signalLabel: 'Signal (encrypted)',
    storiesEmailLabel: 'Encrypted email for stories',
    generalEmailLabel: 'Other enquiries and partners',
    noChannels: 'Secure contact details will be published here soon.',
    safetyTitle: 'Before you contact us',
    safety: [
      'Use a phone or computer that only you can access, not a shared or work device.',
      'On Signal, turn on disappearing messages.',
      'Do not include your full name, location or photos in your first message.',
      'If someone may be watching your screen, press Quick exit at the top of the page, or the Esc key, to leave immediately.',
    ],
    dangerTitle: 'If you are in danger now',
    danger:
      'Contact local emergency services or a person you trust immediately. ISLAAH is a journalism project and cannot respond to emergencies.',
  },
  SO: {
    title: 'Wadaag sheekadaada',
    lead: 'Haddii aad ka soo baxday koox hubaysan, ama qof qoyskaaga ka mid ah uu ka soo baxay, sheekadaadu waa muhiim. Haddii si ammaan ah loo sheego, waxay digniin u noqon kartaa dhallinyaro kale ka hor intaan qoruhu gaadhin.',
    whyTitle: 'Sababta codkaagu muhiim u yahay',
    why: [
      'Qorayaashu waxay ku tiirsan yihiin aamusnaanta. Sheeko kasta oo daacad ah oo ku saabsan waxa dhab ahaan ka dhaca kooxahaas gudahooda waxay adkaysaa in ballamahooda la rumaysto.',
      'Sheekadaadu waxay sidoo kale ka caawin kartaa qoysaska, macallimiinta iyo odayaasha bulshada inay gartaan calaamadaha digniinta, waxayna tusi kartaa kuwa kale ee doonaya inay ka baxaan in jid guriga loogu soo noqdo uu jiro.',
    ],
    promisesTitle: 'Ballamahayaga adiga',
    promises: [
      { title: 'Aqoonsigaagu wuu qarsoon yahay', body: 'Marna ma daabacno magacaaga, wejigaaga ama codkaaga. Akhriye ayaa akhriya ereyadaada, waxaanan beddelnaa faahfaahinta lagugu garan karo.' },
      { title: 'Adiga ayaa go’aanka leh', body: 'Adiga ayaa go’aamiya waxa aad wadaagto. Waad joojin kartaa goor kasta, waxbana lama daabaco ilaa aad oggolaato.' },
      { title: 'Cadaadis iyo lacag midna', body: 'Marna kuguma cadaadin doonno inaad hadasho, mana bixinno lacag sheekooyin, si aan qofna u odhan in lagu iibsaday.' },
      { title: 'Daryeelku waa ka horreeyaa', body: 'Haddii aad u baahan tahay taageero, waxaan kugu hagi karnaa barnaamijyo la isku halayn karo oo latalin iyo dib-u-dhexgal ah, haddii aad sheekadaada wadaagto iyo haddii kaleba.' },
    ],
    channelsTitle: 'Sida si ammaan ah noo la soo xidhiidho',
    channelsIntro: 'Isticmaal kanaal sir ah haddii aad awooddo. Ku bilow farriin gaaban; uma baahnid inaad magacaaga bixiso.',
    signalLabel: 'Signal (sir ah)',
    storiesEmailLabel: 'Iimayl sir ah oo sheekooyinka loogu talagalay',
    generalEmailLabel: 'Su’aalaha kale iyo la-hawlgalayaasha',
    noChannels: 'Faahfaahinta xidhiidhka ammaanka ah halkan ayaa lagu daabici doonaa dhawaan.',
    safetyTitle: 'Ka hor intaadan nala soo xidhiidhin',
    safety: [
      'Isticmaal taleefan ama kombiyuutar adiga oo keliya aad gasho, ha isticmaalin mid la wadaago ama mid shaqo.',
      'Signal-ka, daar farriimaha baaba’a.',
      'Ha ku darin farriintaada ugu horreysa magacaaga oo dhan, goobta aad joogto ama sawirro.',
      'Haddii qof daawanayo shaashaddaada, riix Ka bax degdeg dusha sare ee bogga, ama furaha Esc, si aad isla markiiba uga baxdo.',
    ],
    dangerTitle: 'Haddii aad hadda khatar ku jirto',
    danger:
      'Isla markiiba la xidhiidh adeegyada gurmadka degdegga ah ee maxalliga ah ama qof aad ku kalsoon tahay. ISLAAH waa mashruuc saxaafadeed, mana ka jawaabi karo xaaladaha degdegga ah.',
  },
};

export const aboutContent = (lang: Lang): AboutContent => ABOUT[lang] ?? ABOUT.EN!;
export const contactContent = (lang: Lang): ContactContent => CONTACT_PAGE[lang] ?? CONTACT_PAGE.EN!;
