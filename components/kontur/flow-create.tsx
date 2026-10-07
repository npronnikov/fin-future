'use client';
import {useEffect} from 'react';
import {useKontur} from './context';
import Catalog from './catalog';

/** Old links keep working; templates now live in the shared Catalog. */
export default function FlowCreate() {
  const {ref, go} = useKontur();
  useEffect(() => {go('catalog', ref, 'Flow');}, [ref, go]);
  return <Catalog initialType="Flow"/>;
}
