import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <div className="flex bg-blue-300 justify-center gap-4">
                <a href="https://vite.dev" target="_blank" rel="noreferrer">
                    <img src={viteLogo} className="h-24 w-24 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank" rel="noreferrer">
                    <img
                        src={reactLogo}
                        className="h-24 w-24 animate-spin hover:drop-shadow-[0_0_2em_#61dafbaa]"
                        alt="React logo"
                    />
                </a>
            </div>
            <h1 className="text-5xl font-bold my-8">Vite + React</h1>
            <div className="p-8">
                <button
                    className="bg-gray-800 hover:border-indigo-500 border-2 border-transparent rounded-lg px-6 py-3 text-base font-medium transition-colors"
                    onClick={() => setCount((count) => count + 1)}
                >
                    count is {count}
                </button>
                <p className="mt-4 text-gray-400">
                    Edit <code className="bg-gray-800 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className="text-gray-500">Click on the Vite and React logos to learn more</p>
        </>
    );
}

export default App;
