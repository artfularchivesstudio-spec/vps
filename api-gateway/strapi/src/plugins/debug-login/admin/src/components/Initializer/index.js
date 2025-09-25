// 🌟 Debug Login Initializer - Where Magic Begins
import { useEffect, useRef } from 'react';
import pluginId from '../../pluginId';

const Initializer = ({ setPlugin }) => {
  const ref = useRef();
  ref.current = setPlugin;

  useEffect(() => {
    ref.current(pluginId);
  }, []);

  return null;
};

export default Initializer;
