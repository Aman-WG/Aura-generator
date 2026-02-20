import { Layout } from './components/Layout';
import { ParentBridgeProvider } from './context/ParentBridgeContext';

function App() {
  return (
    <ParentBridgeProvider>
      <Layout />
    </ParentBridgeProvider>
  );
}

export default App;
