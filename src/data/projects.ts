export type Discipline = 'DE' | 'DS' | 'AI';

export interface Project {
  title: string;
  href: string;
  image: string;
  discipline: Discipline;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Challenge';
  stack: string[];
  year?: string;
}

export const projects: Project[] = [
  // Data Engineering
  {
    title: 'Geospatial Data ETL Development',
    href: 'https://github.com/sclauguico/etl-geospatial',
    image: '/img/projects/etl-geospatial.png',
    discipline: 'DE',
    level: 'Beginner',
    stack: ['Python', 'MySQL', 'Foursquare API'],
  },
  {
    title: 'eCommerce E2E Data Engineering',
    href: 'https://github.com/sclauguico/ecommerce-modern-data-stack',
    image: '/img/projects/ecommerce-de.png',
    discipline: 'DE',
    level: 'Intermediate',
    stack: ['dbt', 'Airflow', 'Snowflake'],
  },
  {
    title: 'E2E Data Engineering with DuckDB & MotherDuck',
    href: 'https://github.com/sclauguico/ecom-snowflake-duckdb-migration',
    image: '/img/projects/ecom-ducks.png',
    discipline: 'DE',
    level: 'Advanced',
    stack: ['DuckDB', 'MotherDuck', 'Migration'],
  },
  {
    title: 'eCommerce Data Modeling',
    href: 'https://github.com/sclauguico/ecommerce-data-modeling',
    image: '/img/projects/ecommerce-data-modeling.png',
    discipline: 'DE',
    level: 'Intermediate',
    stack: ['Data Modeling', 'SQL', 'DBDiagram'],
  },

  // Data Science & Analytics
  {
    title: 'ML and Regression with R Workshop',
    href: 'https://github.com/sclauguico/r-linear-regression',
    image: '/img/projects/r-linear-regression.png',
    discipline: 'DS',
    level: 'Beginner',
    stack: ['R', 'Statistics', 'Machine Learning'],
  },
  {
    title: 'eCommerce Business Analysis with SQL',
    href: 'https://github.com/sclauguico/ecommerce-sql-business-analysis',
    image: '/img/projects/ba-sql.png',
    discipline: 'DS',
    level: 'Intermediate',
    stack: ['SQL', 'Snowflake', 'Data Modeling'],
  },
  {
    title: 'eCommerce BI Dashboard with Power BI',
    href: 'https://github.com/sclauguico/ecommerce-sql-business-analysis',
    image: '/img/projects/power-bi.png',
    discipline: 'DS',
    level: 'Intermediate',
    stack: ['Power BI', 'SQL', 'Data Modeling'],
  },

  // AI Engineering
  {
    title: 'AI Chatbot with Memory using Postgres',
    href: 'https://github.com/sclauguico/ai-chatbot-with-memory',
    image: '/img/projects/ai-chatbot-demo.png',
    discipline: 'AI',
    level: 'Beginner',
    stack: ['LangChain', 'Postgres', 'Streamlit'],
  },
  {
    title: 'AI Agents for eCom Analytics',
    href: 'https://github.com/sclauguico/ecom-ai-analyzer',
    image: '/img/projects/ecom-ai-analyzer.png',
    discipline: 'AI',
    level: 'Intermediate',
    stack: ['LangGraph', 'FastAPI', 'React'],
  },
  {
    title: 'CV-Based Lettuce Growth Classification',
    href: 'https://scholar.google.com.ph/citations?view_op=view_citation&hl=en&user=jiTezCwAAAAJ&citation_for_view=jiTezCwAAAAJ:_FxGoFyzp5QC',
    image: '/img/projects/lettuce-classification.png',
    discipline: 'AI',
    level: 'Intermediate',
    stack: ['TensorFlow', 'Image Segmentation', 'Classification'],
  },
  {
    title: 'Grape Leaf Multi-Disease Detection using RCNN',
    href: 'https://scholar.google.com.ph/citations?view_op=view_citation&hl=en&user=jiTezCwAAAAJ&citation_for_view=jiTezCwAAAAJ:3fE2CSJIrl8C',
    image: '/img/projects/grape-leaf-disease.png',
    discipline: 'AI',
    level: 'Advanced',
    stack: ['MATLAB', 'RCNN', 'Object Detection'],
  },
  {
    title: 'Adaptive Management System for Aquaponics',
    href: 'https://scholar.google.com.ph/citations?view_op=view_citation&hl=en&user=jiTezCwAAAAJ&cstart=20&pagesize=80&citation_for_view=jiTezCwAAAAJ:qUcmZB5y_30C',
    image: '/img/projects/thesis.png',
    discipline: 'AI',
    level: 'Challenge',
    stack: ['Control Systems', 'Machine Vision', 'Deep Learning'],
  },
  {
    title: 'Leaf Attribute Prediction Using Deep Learning Networks',
    href: 'https://ieeexplore.ieee.org/abstract/document/9400103',
    image: '/img/projects/leaf-prediction.png',
    discipline: 'AI',
    level: 'Intermediate',
    stack: ['PyTorch', 'Transfer Learning', 'Computer Vision'],
  },
  {
    title: 'Inverse Kinematics for Crop-Harvesting Robotic Arm',
    href: 'https://ieeexplore.ieee.org/abstract/document/9095774',
    image: '/img/projects/robotic-arm.png',
    discipline: 'AI',
    level: 'Intermediate',
    stack: ['Inverse Kinematics', 'MATLAB', 'Universal Robots'],
  },
];

export interface StackItem {
  name: string;
  logo?: string;
  hideLabel?: boolean;
}

export interface StackGroup {
  label: string;
  items: StackItem[];
}

// Simpleicons CDN: https://cdn.simpleicons.org/<slug>
const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;
// Devicon via jsDelivr: https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<slug>/<file>
const di = (slug: string, file = `${slug}-original.svg`) =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${file}`;

export const stack: StackGroup[] = [
  {
    label: 'Data Engineering',
    items: [
      { name: 'Python', logo: '/img/logos/python.png' },
      { name: 'Spark', logo: di('apachespark', 'apachespark-original.svg') },
      { name: 'Airflow', logo: di('apacheairflow', 'apacheairflow-original.svg') },
      { name: 'dbt', logo: '/img/logos/dbt.svg' },
      { name: 'Postgres', logo: '/img/logos/postgre.png' },
      { name: 'MySQL', logo: '/img/logos/mysql.png' },
      { name: 'Databricks', logo: si('databricks') },
      { name: 'GCP', logo: si('googlecloud') },
    ],
  },
  {
    label: 'Data Science',
    items: [
      { name: 'Python', logo: '/img/logos/python.png' },
      { name: 'R', logo: di('r', 'r-original.svg'), hideLabel: true },
      { name: 'NumPy', logo: '/img/logos/numpy.png' },
      { name: 'Pandas', logo: '/img/logos/pandas.png' },
      { name: 'Matplotlib', logo: 'https://matplotlib.org/_static/logo_dark.svg' },
      { name: 'Seaborn', logo: 'https://seaborn.pydata.org/_images/logo-mark-lightbg.svg' },
      { name: 'scikit-learn', logo: '/img/logos/sklearn.png' },
      { name: 'Hugging Face', logo: '/img/logos/huggingface.png' },
      { name: 'TensorFlow', logo: '/img/logos/tensorflow.png' },
      { name: 'PyTorch', logo: '/img/logos/pytorch.png' },
    ],
  },
  {
    label: 'AI Engineering',
    items: [
      { name: 'Python', logo: '/img/logos/python.png' },
      { name: 'LangGraph' },
      { name: 'LangChain', logo: si('langchain') },
      { name: 'LangSmith' },
      { name: 'Pydantic', logo: si('pydantic') },
      { name: 'Docker', logo: '/img/logos/docker.png' },
      { name: 'FastAPI', logo: si('fastapi') },
      { name: 'Postman', logo: si('postman') },
      { name: 'GitLab', logo: si('gitlab') },
    ],
  },
  {
    label: 'MLOps',
    items: [
      { name: 'MLflow', logo: '/img/logos/mlflow.png' },
      { name: 'Git', logo: '/img/logos/git.png' },
      { name: 'Docker', logo: '/img/logos/docker.png' },
      { name: 'AWS', logo: '/img/logos/aws.png' },
      { name: 'DVC', logo: '/img/logos/dvc.svg' },
      { name: 'Hopsworks', logo: '/img/logos/hopsworks.svg' },
    ],
  },
];
