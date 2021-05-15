import React from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';

import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Dependency Injection',
    Svg: require('../../static/img/di.svg').default,
    description: (
      <>
        <Translate>
          Ditsmod має ієрархічний Dependency Injection, що дуже суттєво спрощує розширення та тестування застосунків.
        </Translate>
      </>
    ),
  },
  {
    title: 'TypeScript',
    Svg: require('../../static/img/ts.svg').default,
    description: (
      <>
        <Translate>
          Ditsmod написаний на TypeScript, що дозволяє помітно зменшити кількість помилок в коді, а також дозволяє на
          порядок покращити користувацький досвід написання коду у вашій IDE.
        </Translate>
      </>
    ),
  },
  {
    title: 'Modularity',
    Svg: require('../../static/img/mod.svg').default,
    description: <><Translate>Масштабованість застосунків реалізується завдяки модульній архітектурі Ditsmod.</Translate></>,
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
