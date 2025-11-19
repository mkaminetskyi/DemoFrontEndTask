(function(){
    const toast = document.getElementById('copyToast');

    const showToast = (text) => {
        if (!toast) {
            return;
        }

        if (text) {
            toast.textContent = text;
        }
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1400);
    };

    const copyText = async (text) => {
        if (!text) {
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            showToast('Скопійовано');
        } catch (error) {
            console.error(error);
            showToast('Не вдалось скопіювати');
        }
    };

    const handleCopy = (event) => {
        const element = event.target.closest('.copyable,[data-copy]');
        if (!element) {
            return;
        }

        const text = element.getAttribute('data-copy') || element.textContent.trim();
        copyText(text);
    };

    document.addEventListener('click', handleCopy);
    document.addEventListener('touchend', handleCopy, { passive: true });
})();
