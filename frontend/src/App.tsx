import ChicaChicaApp from './components/ChicaChicaApp';
import UserConversationsProvider from './providers/UserConversationsProvider';

function App() {
    return (
        <UserConversationsProvider>
            <ChicaChicaApp />
        </UserConversationsProvider>
    );
}

export default App;
