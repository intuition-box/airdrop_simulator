/**
 * Community showcase data used by the /showcase page.
 * Adapted from the Docusaurus website showcase implementation.
 */

import {translate} from '@docusaurus/Translate';
import {sortBy} from '@site/src/utils/jsUtils';

export type TagType =
  | 'favorite'
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
    title: 'Airdrop Simulator',
    description:
      'Interactive simulator that helps you test token distribution strategies before running a drop.',
    preview: null,
    website: 'https://intuition.xyz/',
    source: 'https://github.com/intuitionxyz/airdrop-simulator',
    tags: ['favorite', 'product', 'design'],
  },
  {
    title: 'Intuition Docs',
    description:
      'Developer documentation for the Intuition protocol with quick starts, concepts, and API references.',
    preview: null,
    website: 'https://docs.intuition.xyz/',
    source: null,
    tags: ['product', 'opensource'],
  },
  {
    title: 'Community Knowledge Base',
    description:
      'Collaborative wiki where contributors curate tips, playbooks, and best practices for running airdrops.',
    preview: null,
    website: 'https://kb.intuition.xyz/',
    source: 'https://github.com/intuitionxyz/community-kb',
    tags: ['opensource', 'personal'],
  },
  {
    title: 'Analyst Notes',
    description:
      'Personal digital garden tracking experiments and insights gathered while using the simulator.',
    preview: null,
    website: 'https://notes.intuition.xyz/',
    source: null,
    tags: ['personal'],
  },
];

function sortUsers() {
  let result = Users;
  result = sortBy(result, (user) => user.title.toLowerCase());
  result = sortBy(result, (user) => !user.tags.includes('favorite'));
  return result;
}

export const sortedUsers = sortUsers();
