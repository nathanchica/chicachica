import ChatNavigation from './ChatNavigation';
import ConversationView from './ConversationView';

function MainView() {
    return (
        <div className="grid grid-cols-12 gap-4 h-screen">
            <div id="chat-nav" className="col-span-3 shadow-xl flex flex-col bg-white h-screen overflow-hidden">
                <ChatNavigation />
            </div>

            <div id="chat-view" className="col-span-9 shadow-xl bg-white h-screen overflow-hidden">
                <ConversationView />
            </div>
        </div>
    );
}

export default MainView;
