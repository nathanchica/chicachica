import LoginView from './LoginView';
import MainView from './MainView';

import { useUserConversations } from '../providers/UserConversationsProvider';

function ChicaChicaApp() {
    const { loggedInUser } = useUserConversations();

    return (
        <div id="app" className="min-h-dvh bg-emerald-50">
            {loggedInUser ? <MainView /> : <LoginView />}
        </div>
    );
}

export default ChicaChicaApp;
