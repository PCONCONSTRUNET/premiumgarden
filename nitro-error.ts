export default function (error, event) {
  if (event.node && event.node.res) {
    event.node.res.setHeader('Content-Type', 'text/plain');
    event.node.res.end(`Nitro SSR Error: ${error.message}\n\nStack:\n${error.stack}`);
  }
}
