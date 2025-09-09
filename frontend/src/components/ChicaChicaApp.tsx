import { useUserConversations } from '../providers/UserConversationsProvider';
import LoginView from './LoginView';
import MainView from './MainView';

function ChicaChicaApp() {
    const { loggedInUser } = useUserConversations();

    return (
        <div id="app" className="h-dvh bg-emerald-50">
            {loggedInUser ? <MainView /> : <LoginView />}
        </div>
    );
}

export default ChicaChicaApp;
