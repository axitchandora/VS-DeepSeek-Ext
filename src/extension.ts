import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('vs-deepseek-ext.start', () => {

		const panel = vscode.window.createWebviewPanel(
			'deepseek-chat',
			'Deep Seek Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true}
		);

		panel.webview.html = getWebviewContent()

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat'){
				const userPrompt = message.text
				let responseText = ''

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					})

					for await (const part of streamResponse){
						responseText += part.message.content
						panel.webview.postMessage({ command: 'chatResponse', text: responseText})
					}
				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}`})
				}

			}
		})
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string{
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<style>
		 	/* body { font-family: sans-serif; margin: 1rem;}
		 	#prompt {width: 100%; box-sizing: border-box; }
		 	#response { border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem;} */

			body {
            font-family: Arial, sans-serif;
            background-color: #1e1e1e;
            color: #d4d4d4;
            padding: 10px;
			}
			h2 {
				text-align: center;
				color: #61dafb;
			}
			#prompt {
				width: 100%;
				padding: 10px;
				border-radius: 5px;
				border: 1px solid #555;
				background-color: #252526;
				color: #d4d4d4;
				resize: none;
			}
			button {
				width: 100%;
				margin-top: 10px;
				padding: 10px;
				border: none;
				background: #007acc;
				color: white;
				font-size: 16px;
				cursor: pointer;
				border-radius: 5px;
			}
			button:hover {
				background: #005f99;
			}
			#response {
				margin-top: 15px;
				padding: 10px;
				background: #252526;
				border-radius: 5px;
				border: 1px solid #555;
				color: #d4d4d4;
			}


		</style>
		<body>
			<h2>DeepSeek VS Code Extension</h2>
			<textarea id="prompt" rows="3" type="text" placeholder="Enter a prompt..."></textarea>
			<br />
			<button id="askBtn">Ask</button>
			<div id="response"></div>

			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('askBtn').addEventListener('click',()=>{
						const text = document.getElementById('prompt').value;
						vscode.postMessage({ command: 'chat', text });
				});

				window.addEventListener('message', event => {
					const { command, text} = event.data;
					if (command == 'chatResponse'){
						document.getElementById('response').innerText = text;
					}
				});
				
			</script>
		</body>
	</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
