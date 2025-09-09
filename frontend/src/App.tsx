import UserConversationsProvider from './providers/UserConversationsProvider';
import ChicaChicaApp from './components/ChicaChicaApp';

function App() {
    return (
        <UserConversationsProvider>
            <ChicaChicaApp />
        </UserConversationsProvider>
    );
}

export default App;
