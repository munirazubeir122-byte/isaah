// Full text of every episode. The website renders it, and
// scripts/generate-audio.mjs narrates exactly the same words, so the page and
// the audio never drift apart. After editing, run `npm run audio`.
//
// SAMPLE CONTENT: these are composite, illustrative stories written for
// design review. Replace each with a verified, consented testimony before
// publishing, and keep `sample: true` until you do.
//
// This file must stay free of imports so plain Node can read it.

export interface Story {
  id: string;
  sample: boolean;
  title: string;
  hook: string;
  acts: {
    promise: string[];
    reality: string[];
    breakingPoint: string[];
    return: string[];
  };
}

export const STORIES: Story[] = [
  {
    id: 'ep-01',
    sample: true,
    title: 'The Ghost of Cabo Delgado: Promised Wealth, Found Chains',
    hook: 'They promised us land, a prosperous Islamic state, and a salary to support our mothers. Within three weeks, we were eating boiled roots in the mud while coastal villages burned.',
    acts: {
      promise: [
        'I was nineteen and selling phone credit at the bus stand in Pemba. My father had died two years before, and every month my mother asked me, quietly, whether there would be enough for rice. There was never enough.',
        'The men who approached us did not look dangerous. They were polite. They bought tea for the boys at the stand and listened to us complain about the gas companies, about the jobs that went to people from the south, about the police who took bribes from fishermen. They agreed with everything we said.',
        'After a few weeks they began to talk about a different kind of society. A place where the poor would be first, where nobody would be humiliated, where a young man could send money home every month and be respected by God and by his neighbours. They showed us money. They said a monthly payment was waiting. I believed them because I wanted to.',
      ],
      reality: [
        'We were taken north at night in the back of a truck, then on foot. There was no salary. On the third day a commander took our phones and our identity cards and burned them in front of us. He said we no longer needed names from the old world.',
        'The forest near Mbau was wet and hungry. We ate roots, sometimes cassava stolen from farms whose owners had fled. Many boys had malaria and there was no medicine. Those who asked questions were beaten in front of everyone. I saw one boy taken away for asking when we would be paid, and we did not see him again.',
        'The worst part was not the hunger. It was understanding that the villages we were told to protect were the villages we were burning. People like my mother. Markets like the one where I sold credit. Every day the distance between what they had promised and what we were doing grew wider, and every day it became more dangerous to say so.',
      ],
      breakingPoint: [
        'The moment came during an attack by government forces near the swamp. Everything was noise and smoke. The commander who watched us was shouting at someone else, and for a few seconds nobody was looking at me.',
        'I put down the rifle I had been given and I ran. I did not choose a direction. I ran through thorns until my legs bled, and when it was dark I hid in the water among the reeds. I walked for three days, drinking from puddles, terrified of soldiers and terrified of the group.',
        'On the third day I reached a small farm. A farmer saw me before I saw him. He could have called anyone. Instead he gave me a shirt and trousers that belonged to his son and told me to burn my clothes. He said, you are not the first boy to come out of that forest, and you will not be the last.',
      ],
      return: [
        'I presented myself to the authorities through a community leader. There were months of questions, and months in which I did not know whether I would be forgiven or punished. A local reintegration programme finally let me go home to my family in Nampula.',
        'Now I mend fishing nets with my brothers. The work is slow and it does not pay much, but nobody burns anything and I sleep at night. My mother still cries when she looks at the scars on my legs.',
        'The hardest work is talking to the younger boys. Some of them still watch the videos on their phones and think the forest is a place of honour. I tell them about the roots and the fever and the boy who asked about his salary. I tell them that the men who buy you tea are not your friends.',
      ],
    },
  },
  {
    id: 'ep-02',
    sample: true,
    title: 'Eastleigh to the Badlands: How University Dreams Ended in the Shabelle',
    hook: 'I was an accounting student in Nairobi. A charismatic mentor online said jihad was just charitable community work abroad. By the time my passport was burned in Jilib, I knew I was property.',
    acts: {
      promise: [
        'I was in my second year of accounting at a college in Nairobi. My family had sacrificed everything for my fees. I was proud, and I was lonely, and I felt that the city looked at young Somali men as suspects before it looked at us as people.',
        'A study circle started in a basement room in Eastleigh. At first we talked about faith, about discipline, about being good sons. Then an older man joined. He was educated and gentle, and he understood exactly how angry we were. Later the conversations moved to private groups on our phones.',
        'He told me that the work abroad was humanitarian. Building schools, digging wells, defending families who had nobody. He said my accounting skills were needed, that I would be honoured, that I could come back whenever I wanted. He even helped arrange the travel. I told my mother I was going to a conference.',
      ],
      reality: [
        'The moment we crossed, everything changed. My passport and phone were taken and destroyed. The men who received us did not care about my skills. They cared that I could carry things and that I would obey.',
        'There was no brotherhood. There was suspicion. Anyone could be accused of spying, and an accusation was enough. Foreign fighters treated East Africans as the people you send first. We slept with one eye open, and we learned not to trust the person beside us, because he might be reporting on us to save himself.',
        'I kept thinking about my exams. About the lecture hall. About my mother, who believed I was at a conference. I understood that the gentle man in Eastleigh had never once told me the truth. I was not a volunteer. I was property.',
      ],
      breakingPoint: [
        'I became ill, genuinely, with a fever that would not break. I exaggerated how sick I was until they moved me toward an outpost where there was a man who knew some medicine. It was closer to the edge of their territory.',
        'When my fever eased I waited for a night without moon. I walked away with nothing, toward where I had heard the African Union forces were positioned. I walked for most of two days across dry scrub, hiding whenever I heard an engine.',
        'When I finally saw the soldiers I raised my hands high above my head and kept walking slowly. I was more afraid in those last hundred metres than in all the months before. One of them shouted at me to stop and kneel. I knelt, and I cried, and I told them my name, my real name, for the first time in a long time.',
      ],
      return: [
        'After screening I was transferred to a rehabilitation centre in Mombasa. There were counsellors, religious scholars, and other young men who had come back. For the first months I could not sleep without dreaming of the outpost.',
        'Slowly I started to study again. Not accounting yet, but I read, and I talked with the scholars about the verses the recruiter had twisted for me. I learned how carefully he had chosen what to show me and what to hide.',
        'Today I work with a programme that speaks to young people online, in the same spaces where I was recruited. When a boy tells me he feels angry and invisible, I do not argue with his anger. I tell him what is waiting on the other side of that kindness. My mother knows the truth now. She says she has her son back.',
      ],
    },
  },
  {
    id: 'ep-03',
    sample: true,
    title: 'The ADF Mountain Camps: Coercion and Survival in Beni',
    hook: "They didn't recruit me with ideology; they abducted me from my market stall at gunpoint. In the Rwenzori mountains, you either obey or dig your own grave.",
    acts: {
      promise: [
        'There was no promise in my story. I was selling tomatoes and dried fish at a market outside Beni when the shooting started. People ran in every direction. Two men grabbed me and my cousin and tied our wrists together with rope.',
        'They marched us into the forest that same day. Anyone who fell behind was threatened, and some who could not continue were left behind in ways I will not describe. I learned very quickly that my life now depended on keeping up.',
        'Later, in the camp, they gave speeches about faith and about a pure state. But I understood that for people like me the speeches came after the rope. Many of the people I met had been taken the same way. The ideology was a story they told to justify what they had already done.',
      ],
      reality: [
        'They made us porters. We carried heavy boxes up steep paths in the rain, mud to our knees, for hours. Our shoulders bled. The commanders lived in caves and in the better shelters. We slept on the ground under plastic sheeting.',
        'There was always fear from the sky. When we heard drones, everyone froze and lay flat under the trees. Below us there was malaria and dysentery. Food was raw cassava taken from farms whose families had fled. My cousin became very sick and they would not let me sit with him.',
        'In that place, you either obey or you dig your own grave. They said it to us directly. I did not believe in anything they said, but I obeyed, because I wanted to see my children again. That is what coercion means. It is not belief. It is survival.',
      ],
      breakingPoint: [
        'The army raided the camp at dawn. There was gunfire on every side, and for once the men who guarded us were thinking only about themselves.',
        'Behind the shelters there was a steep ravine down to a river. I had looked at it every day for months. That morning I did not think. I threw myself down the slope, sliding and falling, and let the current take me.',
        'The water carried me a long way. I held on to branches when I could and floated when I could not. In the afternoon I pulled myself out near a road and saw a military checkpoint. I walked toward it with my hands open so they could see they were empty.',
      ],
      return: [
        'I was questioned for many days. The soldiers needed to know whether I was a fighter or a captive. A local organisation helped my family find me and spoke for me. Eventually I was allowed to go home.',
        'I farm maize again in North Kivu. My hands carry the scars of those boxes, and my shoulders still ache when it rains. Some neighbours were afraid of me at first. That has eased with time.',
        'My children go to school every morning. Every morning I walk them to the road and watch them until I cannot see them anymore. My cousin did not come back. I speak for him too when I tell this story.',
      ],
    },
  },
  {
    id: 'ep-04',
    sample: true,
    title: 'Tanga Coastline: Smuggling Youth Through the Mangroves',
    hook: 'They told us the government was waging war against true believers. They loaded us onto small wooden dhows under the cover of a new moon, bound for northern Mozambique.',
    acts: {
      promise: [
        'In our part of Tanga there was little work for young men. Some of us fished, some of us waited. Then a group of wealthy men began to appear in the community, and they were generous.',
        'They paid for weddings. They gave small loans to boys who wanted to start a business. They repaired the roof of a madrasa. Nobody asked where the money came from. By the time they started talking about politics, half the young men in the area owed them something.',
        'Their message was that believers were being persecuted, and that a true man would not sit still while that happened. They said there was land waiting across the border, and dignity, and a purpose. They made leaving sound like a duty to God and to the community that had been so kind to us.',
      ],
      reality: [
        'They took us out on small wooden dhows on a night with no moon, packed close together, told not to speak. We landed among mangroves far from any town.',
        'The training camp was in the swamp. The air was heavy and the mosquitoes never stopped. We drank brackish water and many of us were sick. All day there were sessions where they told us that our families were unbelievers, that the elders who raised us were our enemies.',
        'They took our names away and gave us numbers. That was when I understood. A man with a name has a mother and a village. A man with a number has only the group. They were erasing everything that could call us home.',
      ],
      breakingPoint: [
        'Months later we were sent to help unload supplies from a boat at night. I was in the water up to my chest, passing sacks from hand to hand.',
        'There was a moment when the man beside me turned away. I let go of the sack and sank under the surface and let the dark water hide me. I swam away from the lights, slowly at first, then with all my strength.',
        'It took me about two hours against the tide to reach the mainland. I lay on the sand until I could stand. Then I walked inland until morning, and asked the first person I saw to take me to the village elders.',
      ],
      return: [
        'The elders did not welcome me immediately. They had to be sure. There were long conversations, with my family, with the imam, with local officials. I told them everything, including the names of the men who had paid for the weddings.',
        'When they were satisfied that I had truly left, they stood beside me in front of the community. That is what allowed people to accept me again. Without the elders I would have been a stranger in my own town.',
        'Today I work as a mechanic in Tanga town. When a generous stranger offers a young man a loan, I am the one who asks where the money comes from. I tell them that kindness with conditions is not kindness. It is a hook.',
      ],
    },
  },
];
