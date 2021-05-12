import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Dependency Injection',
    Svg: require('../../static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Ditsmod має ієрархічний Dependency Injection, що дуже суттєво срощує розширення та тестування
        застосунків.
      </>
    ),
  },
  {
    title: 'TypeScript',
    Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Ditsmod написаний на TypeScript, який дозволяє помітно зменшити кількість
        помилок в коді, а також дозволяє на порядок покращити користувацький досвід
        написання коду у вашій IDE.
      </>
    ),
  },
  {
    title: 'Modularity',
    Svg: require('../../static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Масштабованість застосунків реалізується завдяки модульній архітектурі Ditsmod.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
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
