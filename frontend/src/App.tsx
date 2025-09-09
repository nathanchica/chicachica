import { useEffect } from 'react';

function App() {
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('http://localhost:3001/');
            const data = await response.json();
            console.log(data);
        };
        fetchData();
    }, []);

    return (
        <>
            <div id="app" className="h-dvh bg-gray-50">
                <div className="grid grid-cols-12 gap-4 min-h-full">
                    <div id="chat-nav" className="col-span-3 p-6 shadow-xl">
                        <h1 className="text-2xl font-bold">chicahan</h1>
                    </div>
                    <div id="chat-view" className="col-span-9 p-8 shadow-xl">
                        <h1>Hello Vite + React!</h1>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
