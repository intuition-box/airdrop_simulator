/**
 * Community showcase data used by the /showcase page.
 * Adapted from the Docusaurus website showcase implementation.
 */

import {translate} from '@docusaurus/Translate';
import {sortBy} from '@site/src/utils/jsUtils';

export type TagType =
  | 'favorite'
  | 'community'
  | 'opensource'
  | 'product'
  | 'design'
  | 'personal';

export type User = {
  title: string;
  description: string;
  preview: string | null; // null = use the remote screenshot service
  website: string;
  source: string | null;
  tags: TagType[];
};

export type Tag = {
  label: string;
  description: string;
  color: string;
};

export const Tags: {[type in TagType]: Tag} = {
  favorite: {
    label: translate({message: 'Favorite'}),
    description: translate({
      message:
        'Our hand-picked experiences that best highlight what the community is building.',
      id: 'showcase.tag.favorite.description',
    }),
    color: '#e9669e',
  },
  community: {
    label: translate({message: 'Community'}),
    description: translate({
      message: 'Community-built tools and experimentations created during Intuition events.',
      id: 'showcase.tag.community.description',
    }),
    color: '#ffb347',
  },
  opensource: {
    label: translate({message: 'Open-Source'}),
    description: translate({
      message: 'Projects that publish their Docusaurus source code for everyone to learn from.',
      id: 'showcase.tag.opensource.description',
    }),
    color: '#39ca30',
  },
  product: {
    label: translate({message: 'Product'}),
    description: translate({
      message: 'Live products and services with documentation powered by Docusaurus.',
      id: 'showcase.tag.product.description',
    }),
    color: '#dfd545',
  },
  design: {
    label: translate({message: 'Design'}),
    description: translate({
      message:
        'Beautiful implementations that go beyond the default theme to create a memorable experience.',
      id: 'showcase.tag.design.description',
    }),
    color: '#a44fb7',
  },
  personal: {
    label: translate({message: 'Personal'}),
    description: translate({
      message: 'Personal blogs, wikis, and playgrounds shared by community members.',
      id: 'showcase.tag.personal.description',
    }),
    color: '#14cfc3',
  },
};

export const TagList = Object.keys(Tags) as TagType[];

const Users: User[] = [
  {
    title: 'deft_gfx',
    description: 'Community build submitted by Discord: deft_gfx.',
    preview: null,
    website: 'https://intuitionchecker.vercel.app/',
    source: null,
    tags: ['favorite', 'community'],
  },
  {
    title: 'jade_m13',
    description: 'Community build submitted by Discord: jade_m13 • X: @jademichel_.',
    preview: null,
    website: 'https://jade-m22.github.io/airdrop_calculator/',
    source: null,
    tags: ['favorite', 'community'],
  },
  {
    title: 'pandusatrio',
    description: 'Community build submitted by Discord: pandusatrio • X: @0xpandus.',
    preview: null,
    website: 'https://v0-points-and-nft-calculator.vercel.app/',
    source: null,
    tags: ['favorite', 'community'],
  },
  {
    title: 'nuelthegreat',
    description: 'Community build submitted by Discord: nuelthegreat • X: @0xxnuel.',
    preview: null,
    website: 'https://trust-allocation.replit.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'yunji15',
    description: 'Community build submitted by Discord: yunji15 • X: @Yunji_TV.',
    preview: null,
    website: 'https://v0-trust-airdrop-simulator.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'lutin_75',
    description: 'Community build submitted by Discord: lutin_75 • X: @Cryptdsco.',
    preview: null,
    website: 'https://alexandretedesco.github.io/Trust-airdrop-simulator/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'elijahlawrenc15',
    description: 'Community build submitted by Discord: elijahlawrenc15 • X: @oddsgibs.',
    preview: null,
    website: 'https://check-trust.vercel.app',
    source: null,
    tags: ['community'],
  },
  {
    title: 'newbiexbt',
    description: 'Community build submitted by Discord: newbiexbt • X: @NewbieXBT.',
    preview: null,
    website: 'https://intuitionfunchecker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'novasko',
    description: 'Community build submitted by Discord: novasko • X: @Novasko17.',
    preview: null,
    website: 'https://v0-intuition-checker-website.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'nothere1',
    description: 'Community build submitted by Discord: nothere1.',
    preview: null,
    website: 'https://trustairdropchecker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'destr0xx',
    description: 'Community build submitted by Discord: destr0xx • X: @Babalandlord2.',
    preview: null,
    website: 'https://v0-trust-airdrop-simulator-tau.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'ttteardrops',
    description: 'Community build submitted by Discord: ttteardrops • X: @ttteardrops.',
    preview: null,
    website: 'https://checker-intuition.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'cypherdavee',
    description: 'Community build submitted by Discord: cypherdavee • X: @airdropdavee.',
    preview: null,
    website: 'https://intuition-calculator.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'i2playy',
    description: 'Community build submitted by Discord: i2playy • X: @i2playy.',
    preview: null,
    website: 'https://v0-airdrop-simulator-rho.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'u4believe',
    description: 'Community build submitted by Discord: u4believe • X: @u4believe.',
    preview: null,
    website: 'https://v0-airdrop-checker-simulator-delta.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@xybersam',
    description: 'Community build submitted by X: @xybersam.',
    preview: null,
    website: 'https://trustlayerbyintuition.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'blitzzbunny',
    description: 'Community build submitted by Discord: blitzzbunny • X: @BlitzBunny2.',
    preview: null,
    website: 'https://trusttothemoon.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@LoadedCT',
    description: 'Community build submitted by X: @LoadedCT.',
    preview: null,
    website: 'https://v0-airdrop-checker-simulator-nine.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'play_crypt',
    description: 'Community build submitted by Discord: play_crypt • X: @play_crypt.',
    preview: null,
    website: 'https://intuition-airdrop-checker.netlify.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'oluwatammie.',
    description: 'Community build submitted by Discord: oluwatammie. • X: @OluwaTammie.',
    preview: null,
    website: 'https://v0-airdrop-checker-refinement.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'samoris',
    description: 'Community build submitted by Discord: samoris • X: @Samoris4.',
    preview: null,
    website: 'https://trust-airdrop-checker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'smart6609',
    description: 'Community build submitted by Discord: smart6609 • X: @i_write_codes.',
    preview: null,
    website: 'https://v0-airdrop-calculator-ui.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@onlykraft',
    description: 'Community build submitted by X: @onlykraft.',
    preview: null,
    website: 'https://intuitionlivechecker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'kobkpokpor',
    description: 'Community build submitted by Discord: kobkpokpor • X: @kobkpokpor.',
    preview: null,
    website: 'https://trust-token.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'munah3',
    description: 'Community build submitted by Discord: munah3 • X: @Munachike.',
    preview: null,
    website: 'https://bigace-trust.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@javier_tuerca',
    description: 'Community build submitted by X: @javier_tuerca.',
    preview: null,
    website: 'https://v0-airdrop-simulator-trust.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@wolf_de_web3',
    description: 'Community build submitted by X: @wolf_de_web3.',
    preview: null,
    website: 'https://the-trust-checker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'donmaxx1',
    description: 'Community build submitted by Discord: donmaxx1 • X: @maxwellll_.',
    preview: null,
    website: 'https://v0-airdrop-checker-page-plum.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'yevnnefer',
    description: 'Community build submitted by Discord: yevnnefer • X: @Yevnnefer.',
    preview: null,
    website: 'https://trustcheker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'kennykay5761',
    description: 'Community build submitted by Discord: kennykay5761 • X: @Web3ree_Xplorer.',
    preview: null,
    website: 'https://v0-airdrop-simulator-ten.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'photogod',
    description: 'Community build submitted by Discord: photogod • X: @0xPhotogod.',
    preview: null,
    website: 'https://v0-hello-five-psi.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'bjcrypt',
    description: 'Community build submitted by Discord: bjcrypt • X: @Brightstarworl1.',
    preview: null,
    website: 'https://intuition-trust-airdrop.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'toluwani_',
    description: 'Community build submitted by Discord: toluwani_ • X: @uchiha_od.',
    preview: null,
    website: 'https://trust-pourmehopium.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'theewhitte_wolf',
    description: 'Community build submitted by Discord: theewhitte_wolf • X: @TheeWhitte_wolf.',
    preview: null,
    website: 'https://v0-trust-reactor-ui.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'eche992',
    description: 'Community build submitted by Discord: eche992 • X: @savvy_canny.',
    preview: null,
    website: 'https://intuitiontrust.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@Alastor_Aligned',
    description: 'Community build submitted by X: @Alastor_Aligned.',
    preview: null,
    website: 'https://baboev0.github.io/trust-checker/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'maxsnow8110',
    description: 'Community build submitted by Discord: maxsnow8110 • X: @CapalotRE.',
    preview: null,
    website: 'https://v0-trust-airdrop-simulator-two.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'grandplayer1',
    description: 'Community build submitted by Discord: grandplayer1 • X: @GrandRyuma.',
    preview: null,
    website: 'https://v0-airdrop-checker.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@adisaailes',
    description: 'Community build submitted by X: @adisaailes.',
    preview: null,
    website: 'https://v0-trust-graph-explorer.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'yiannis94',
    description: 'Community build submitted by Discord: yiannis94 • X: @ioannisf94.',
    preview: null,
    website: 'https://v0.app/chat/pyramid-simulation-hoodie-h5saCz6021j',
    source: null,
    tags: ['community'],
  },
  {
    title: 'drooo12029',
    description: 'Community build submitted by Discord: drooo12029 • X: @SupriYa49265575.',
    preview: null,
    website: 'https://checker-intuition.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'animetv7772',
    description: 'Community build submitted by Discord: animetv7772 • X: @Eghosa1a.',
    preview: null,
    website: 'https://v0-airdrop-checker-app.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: '@MDSozibIslam7',
    description: 'Community build submitted by X: @MDSozibIslam7.',
    preview: null,
    website: 'https://v0-token-claim-portal.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'kachilarry',
    description: 'Community build submitted by Discord: kachilarry • X: @kachilarry.',
    preview: null,
    website: 'https://v0-airdrop-simulator-azure.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'omiaydin',
    description: 'Community build submitted by Discord: omiaydin • X: @omiaydin.',
    preview: null,
    website: 'https://v0-omiaydin.vercel.app/',
    source: null,
    tags: ['community'],
  },
  {
    title: 'b.cdev',
    description: 'Community build submitted by Discord: b.cdev • X: @OyeleyeDolapo2.',
    preview: null,
    website: 'https://v0.app/chat/intuition-allocation-calculator-ptLhN58rdcT',
    source: null,
    tags: ['community'],
  },
  {
    title: '@Impulse_84',
    description: 'Community build submitted by X: @Impulse_84.',
    preview: null,
    website: 'https://v0.app/chat/trust-token-eligibility-checker-jtJjFfso1Co',
    source: null,
    tags: ['community'],
  },
  {
    title: '@Mmapule_',
    description: 'Community build submitted by X: @Mmapule_.',
    preview: null,
    website: 'https://0xintuition-trust-checker.vercel.app/',
    source: null,
    tags: ['community'],
  },
];


function sortUsers() {
  let result = Users;
  result = sortBy(result, (user) => user.title.toLowerCase());
  result = sortBy(result, (user) => !user.tags.includes('favorite'));
  return result;
}

export const sortedUsers = sortUsers();
