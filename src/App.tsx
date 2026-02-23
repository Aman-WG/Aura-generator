import { Layout } from './components/Layout';
import { ParentBridgeProvider } from './context/ParentBridgeContext';
import { AuraPlayground } from './AuraPlayground';

const isPlayground = window.location.search.includes('playground');

function App() {
  if (isPlayground) {
    return <AuraPlayground />;
  }

  return (
    <ParentBridgeProvider>
      <Layout />
    </ParentBridgeProvider>
  );
}

export default App;
