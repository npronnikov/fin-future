import React from 'react';
import {createRoot} from 'react-dom/client';
import KonturApp from '../components/kontur/app';
import './styles.css';
import './reference-theme.css';
import './onboarding.css';
import './workflow.css';
import './flow-editor.css';
import './setup-v14.css';
import './flow-v14.css';
import './workspace-v14.css';
import './collaboration-v15.css';
import './capability-v15.css';
import './policy-v15.css';

const root = document.getElementById('root');
if (!root) throw new Error('Не найден корневой элемент приложения.');
createRoot(root).render(<KonturApp />);
