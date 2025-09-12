import ChicaChicaApp from './components/ChicaChicaApp';
import ConversationSocketProvider from './providers/ConversationSocketProvider';
import UserConversationsProvider from './providers/UserConversationsProvider';

function App() {
    return (
        <UserConversationsProvider>
            <ConversationSocketProvider>
                <ChicaChicaApp />
            </ConversationSocketProvider>
        </UserConversationsProvider>
    );
}

export default App;
