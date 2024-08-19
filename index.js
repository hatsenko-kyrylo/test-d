import { baseUrl, accessToken, uploadUrl } from './config.js';

async function fetchData(path) {
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path, recursive: false }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}
function handleClick(file, header, subFolderList, img, uploadSection) {
    return async () => {
        try {
            if (subFolderList.children.length === 0) {
                const data = await fetchData(file.path_lower);
                renderFiles(data.entries, subFolderList);
            }

            const isHidden = subFolderList.style.display === 'none';
            subFolderList.style.display = isHidden ? 'block' : 'none';
            img.src = isHidden ? './assets/folder-open.svg' : './assets/folder.svg';
            uploadSection.style.display = isHidden ? 'block' : 'none';
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };
}
function createFolderElement(file) {
    const li = document.createElement('li');
    const header = document.createElement('h3');
    const img = document.createElement('img');
    const subFolderList = document.createElement('ul');

    subFolderList.style.display = 'none';
    img.src = './assets/folder.svg';
    img.alt = 'Folder icon';
    header.textContent = file.name;
    header.appendChild(img);
    li.appendChild(header);
    li.className = 'folder';
    li.id = file.id;
    li.appendChild(subFolderList);

    const uploadSection = createUploadSection(file.path_lower, subFolderList);
    li.appendChild(uploadSection);
    header.onclick = handleClick(file, header, subFolderList, img, uploadSection);
    return li;
}
function createFileElement(file) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `https://www.dropbox.com/home${file.path_lower}`;
    link.textContent = file.name;
    link.target = '_blank';
    li.className = 'file';
    li.appendChild(link);
    return li;
}
function createUploadSection(path, subFolderList) {
    const uploadSection = document.createElement('div');
    uploadSection.className = 'upload-section';
    uploadSection.style.display = 'none';

    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = 'Upload File';
    uploadLabel.className = 'upload-label';

    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.className = 'upload-input';
    uploadInput.dataset.path = path;

    uploadLabel.appendChild(uploadInput);
    uploadSection.appendChild(uploadLabel);

    uploadInput.addEventListener('change', async (event) => {
        const fileToUpload = event.target.files[0];
        if (fileToUpload) {
            try {
                await uploadFile(fileToUpload, uploadInput.dataset.path);
                await refreshFolderList(path, subFolderList);
            } catch (error) {
                console.error('Upload error:', error);
                alert('Error uploading file.');
            }
        }
    });

    return uploadSection;
}
function renderFiles(files, parentElement) {
    if (!files || files.length === 0) {
        parentElement.textContent = 'Folder is empty';
        return;
    }

    parentElement.innerHTML = '';

    files.forEach((file) => {
        const fileElement =
            file['.tag'] === 'folder' ? createFolderElement(file) : createFileElement(file);
        parentElement.appendChild(fileElement);
    });
}
function displayInitialFiles() {
    const filesList = document.getElementById('files');
    if (!filesList) {
        console.error('Element with id "files" not found');
        return;
    }

    fetchData('')
        .then((data) => {
            renderFiles(data.entries, filesList);
        })
        .catch((error) => {
            console.error('Fetch error:', error);
        });

    const mainUploadInput = document.querySelector('.upload-input');
    mainUploadInput.addEventListener('change', (event) => {
        const fileToUpload = event.target.files[0];
        if (fileToUpload) {
            uploadFile(fileToUpload, '')
                .then(() => displayInitialFiles())
                .catch((error) => {
                    console.error('Upload error:', error);
                    alert('Error uploading file.');
                });
        }
    });
}
function uploadFile(file, path) {
    return fetch(uploadUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: `${path}/${file.name}`,
                mode: 'add',
                autorename: true,
                mute: false,
            }),
            'Content-Type': 'application/octet-stream',
        },
        body: file,
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            alert('File uploaded successfully!');
        })
        .catch((error) => {
            console.error('Upload error:', error);
            alert('Error uploading file.');
        });
}
async function refreshFolderList(path, subFolderList) {
    try {
        const data = await fetchData(path);
        renderFiles(data.entries, subFolderList);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

displayInitialFiles();
