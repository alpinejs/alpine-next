import Alpine from '../alpine'

Alpine.magic('get', () => {
    return (url, params) => new Promise(resolve => {
        if (params) {
            url = url + '?' + Object.entries(params).map(([key, value]) => key+'='+value).join('&')
        }

        fetch(url,
            {
                method: 'GET',
                // This enables "cookies".
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/html, application/xhtml+xml',
                },
            }
        )
        .then(response => {
            if (response.ok) {
                response.text().then(response => {
                    resolve(response)

                })
            }
        })
    })
})
