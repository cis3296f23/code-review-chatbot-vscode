import { useEffect } from 'react';
import showdown from 'showdown';
import microlight from 'microlight';

import './App.css'

type WebviewEvent = {
    data: {
        type: string;
        value: string;
    };
};

function App() {
    const vscode = (window as any).acquireVsCodeApi();

    let response = '';

    useEffect(() => {
        function handleMessage(event: WebviewEvent) {
            const message = event.data;
            switch (message.type) {
                case 'addResponse':
                    response = message.value;
                    setResponse();
                    break;
                case 'clearResponse':
                    response = '';
                    break;
                case 'setPrompt':
                    (document.getElementById('prompt-input') as HTMLInputElement).value = message.value;
                    break;
            }
        }

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const fixCodeBlocks = (input: string) => {
        const REGEX_CODEBLOCK = new RegExp('```', 'g');
        const matches = input.match(REGEX_CODEBLOCK);
        const count = matches ? matches.length : 0;
        return count % 2 === 0 ? input : input.concat('\n```');
    };

    const setResponse = () => {
        const converter = new showdown.Converter({
            omitExtraWLInCodeBlocks: true,
            simplifiedAutoLink: true,
            excludeTrailingPunctuationFromURLs: true,
            literalMidWordUnderscores: true,
            simpleLineBreaks: true
        });
        response = fixCodeBlocks(response);
        let html = converter.makeHtml(response);
        const responseElement = document.getElementById('response');
        if (responseElement) {
            responseElement.innerHTML = html;

            const preCodeBlocks = responseElement.querySelectorAll('pre code');
            preCodeBlocks.forEach((block) => {
                block.classList.add('p-2', 'my-2', 'block', 'overflow-x-scroll');
            });

            const codeBlocks = responseElement.querySelectorAll('code');
            codeBlocks.forEach((codeBlock) => {
                if (codeBlock.innerText.startsWith('Copy code')) {
                    codeBlock.innerText = codeBlock.innerText.replace('Copy code', '');
                }

                codeBlock.classList.add('inline-flex', 'max-w-full', 'overflow-hidden', 'rounded-sm', 'cursor-pointer');

                codeBlock.addEventListener('click', (e) => {
                    e.preventDefault();
                    vscode.postMessage({
                        type: 'codeSelected',
                        value: codeBlock.innerText
                    });
                });

                const divElement = document.createElement('div');
                divElement.innerHTML = codeBlock.innerHTML;
                codeBlock.innerHTML = '';
                codeBlock.appendChild(divElement);
                divElement.classList.add('code');
            });

            microlight.reset('code');
        }
    };

    const handlePromptInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            vscode.postMessage({
                type: 'prompt',
                value: (e.target as HTMLInputElement).value
            });
        }
    };


    return (
        <>
            {/* This is just a placeholder. You can add more JSX code as per your actual component requirement */}
            <input id="prompt-input" onKeyUp={handlePromptInput} />
            <div id="response"></div>
        </>
  )
}

export default App
