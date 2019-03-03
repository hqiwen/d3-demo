const startButton = document.getElementById('startButton'),
    loadingSpan = document.getElementById('loadingSpan'),
    ProgressBar = new COREHTML5.ProgressBar('rgba(0,0,0,0.2)', 'teal', 90, 70);
let percentComplete = 0;

startButton.onclick = function (e) {
    loadingSpan.style.display = 'inline';
    startButton.style.display = 'none';

    percentComplete += 1.0;

    if (percentComplete > 100) {
        percentComplete = 0;
        startButton.style.display = 'inline';
        loadingSpan.style.display = 'none';
    } else {
        ProgressBar.erase();
        ProgressBar.draw(percentComplete);
        window.requestAnimationFrame(startButton.onclick);
    }
}
ProgressBar.appendTo(document.getElementById('progressBarDiv'));