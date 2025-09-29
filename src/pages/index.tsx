import type {ReactNode} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import TrustAirdropCalculator from '@site/src/components/TrustAirdropCalculator';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={clsx('container', styles.heroContent)}>
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
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
      <div className={styles.videoBackground}>
        <video
          className={styles.backgroundVideo}
          src="https://res.cloudinary.com/dfpwy9nyv/video/upload/v1755013447/Portal%20Assets/video/hero-loop_mlllaj.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
      <br />
      <br />
          <TrustAirdropCalculator />

    </Layout>
  );
}
