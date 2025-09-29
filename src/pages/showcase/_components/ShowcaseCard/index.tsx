/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import Image from '@theme/IdealImage';
import {Tags, TagList, type TagType, type User} from '@site/src/data/users';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {sortBy} from '@site/src/utils/jsUtils';
import Heading from '@theme/Heading';
import FavoriteIcon from '../FavoriteIcon';
import styles from './styles.module.css';

function TagItem({
  label,
  description,
  color,
}: {
  label: string;
  description: string;
  color: string;
}) {
  return (
    <li className={styles.tag} title={description}>
      <span className={styles.textLabel}>{label.toLowerCase()}</span>
      <span className={styles.colorLabel} style={{backgroundColor: color}} />
    </li>
  );
}

function ShowcaseCardTag({tags}: {tags: TagType[]}) {
  const tagObjects = tags.map((tag) => ({tag, ...Tags[tag]}));

  // Keep same order for all tags
  const tagObjectsSorted = sortBy(tagObjects, (tagObject) =>
    TagList.indexOf(tagObject.tag),
  );

  return (
    <>
      {tagObjectsSorted.map((tagObject, index) => {
        return <TagItem key={index} {...tagObject} />;
      })}
    </>
  );
}

function getCardImage(user: User): string {
  return (
    user.preview ??
    // TODO make it configurable
    `https://slorber-api-screenshot.netlify.app/${encodeURIComponent(
      user.website,
    )}/showcase`
  );
}

function ShowcaseCard({user}: {user: User}) {
  const image = getCardImage(user);
  const avatarUrl = user.avatar ? useBaseUrl(user.avatar) : null;
  const xProfileUrl = user.xHandle ? `https://x.com/${user.xHandle}` : null;

  return (
    <li key={user.title} className={clsx('card shadow--md', styles.showcaseCard)}>
      <Link
        href={user.website}
        className={styles.cardOverlay}
        aria-label={`Open ${user.title}`}
      />
      <div className={clsx('card__image', styles.showcaseCardImage)}>
        <Image img={image} alt={user.title} />
      </div>
      <div className={clsx('card__body', styles.cardContent)}>
        <div className={clsx(styles.showcaseCardHeader)}>
          <div className={styles.showcaseCardTitleGroup}>
            {avatarUrl && (
              xProfileUrl ? (
                <Link
                  href={xProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(styles.showcaseCardAvatarLink, styles.cardInteractive)}>
                  <img
                    className={styles.showcaseCardAvatar}
                    src={avatarUrl}
                    alt={`${user.title} avatar`}
                  />
                </Link>
              ) : (
                <img
                  className={styles.showcaseCardAvatar}
                  src={avatarUrl}
                  alt={`${user.title} avatar`}
                />
              )
            )}
            <Heading as="h4" className={styles.showcaseCardTitle}>
              {xProfileUrl ? (
                <Link
                  href={xProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(styles.showcaseCardNameLink, styles.cardInteractive)}>
                  {user.title}
                </Link>
              ) : (
                user.title
              )}
            </Heading>
          </div>
          {user.tags.includes('favorite') && (
            <FavoriteIcon size="medium" style={{marginRight: '0.25rem'}} />
          )}
          {user.source && (
            <Link
              href={user.source}
              className={clsx(
                'button button--secondary button--sm',
                styles.showcaseCardSrcBtn,
                styles.cardInteractive,
              )}>
              <Translate id="showcase.card.sourceLink">source</Translate>
            </Link>
          )}
        </div>
        <p className={styles.showcaseCardBody}>{user.description}</p>
      </div>
      <ul className={clsx('card__footer', styles.cardFooter, styles.cardContent)}>
        <ShowcaseCardTag tags={user.tags} />
      </ul>
    </li>
  );
}

export default React.memo(ShowcaseCard);
