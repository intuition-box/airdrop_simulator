import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import TrustAirdropCalculator from '@site/src/components/TrustAirdropCalculator';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <video
        className={styles.heroVideo}
        src="https://res.cloudinary.com/dfpwy9nyv/video/upload/v1755013447/Portal%20Assets/video/hero-loop_mlllaj.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/img/docusaurus-social-card.jpg"
      />
      <div className={styles.heroOverlay} />
      <div className={clsx('container', styles.heroContent)}>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/showcase">
            Explore Community Builds ↗
          </Link>
        </div>
        <div className={styles.heroCalculator}>
          <TrustAirdropCalculator />
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main />
    </Layout>
  );
}
