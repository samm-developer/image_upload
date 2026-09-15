import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [images, setImages] = useState([]);
  const [galleryState, setGalleryState] = useState('loading');

  async function loadImages() {
    setGalleryState('loading');
    try {
      const response = await fetch(`${API_URL}/uploads`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load images.');
      setImages(result.images);
      setGalleryState('ready');
    } catch (loadError) {
      setError(loadError.message);
      setGalleryState('error');
    }
  }

  useEffect(() => {
    loadImages();
  }, []);

  function chooseFile(event) {
    const selected = event.target.files?.[0];
    setError('');
    setUploadedFile(null);
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setFile(null);
      setError('Please choose an image file.');
      return;
    }
    setFile(selected);
    setState('idle');
  }

  async function uploadFile(event) {
    event.preventDefault();
    if (!file) return;
    setState('signing');
    setError('');
    try {
      const signResponse = await fetch(`${API_URL}/uploads/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      const signed = await signResponse.json();
      if (!signResponse.ok) throw new Error(signed.error || 'Could not create upload URL.');

      setState('uploading');
      const s3Response = await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Response.ok) throw new Error('S3 rejected the file upload. Check the bucket CORS policy.');

      setState('confirming');
      const completeResponse = await fetch(`${API_URL}/uploads/${signed.uploadId}/complete`, { method: 'POST' });
      const complete = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(complete.error || 'Could not confirm upload.');
      setUploadedFile(complete.upload);
      setState('success');
      await loadImages();
    } catch (uploadError) {
      setError(uploadError.message);
      setState('error');
    }
  }

  const isBusy = ['signing', 'uploading', 'confirming'].includes(state);
  const statusText = {
    signing: 'Creating a secure upload URL...',
    uploading: 'Uploading directly to S3...',
    confirming: 'Saving upload details...',
  }[state];

  return (
    <main className="page-shell">
      <section className="intro">
        <p className="eyebrow">S3 / DIRECT TRANSFER</p>
        <h1>Put images<br /><em>in their place.</em></h1>
        <p className="lede">A private, signed handoff from your browser to your bucket. Your image never passes through the Node API.</p>
        <div className="flow">
          <span>01 choose</span><i /> <span>02 sign</span><i /> <span>03 store</span>
        </div>
      </section>

      <section className="upload-panel">
        <div className="panel-heading">
          <div>
            <p className="kicker">IMAGE DROP</p>
            <h2>Upload an image</h2>
          </div>
          <span className={`status-dot ${state}`} aria-label={state} />
        </div>

        <form onSubmit={uploadFile}>
          <label className={`dropzone ${file ? 'has-file' : ''}`}>
            <input type="file" accept="image/*" onChange={chooseFile} disabled={isBusy} />
            {file ? (
              <>
                <span className="file-icon">IMG</span>
                <strong>{file.name}</strong>
                <small>{formatBytes(file.size)} · {file.type}</small>
              </>
            ) : (
              <>
                <span className="plus">+</span>
                <strong>Choose an image</strong>
                <small>PNG, JPG, GIF or WebP</small>
              </>
            )}
          </label>
          <button type="submit" disabled={!file || isBusy}>
            {isBusy ? statusText : state === 'success' ? 'Upload another image' : 'Upload to S3'}
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        {error && <p className="message error">{error}</p>}
        {state === 'success' && uploadedFile && (
          <div className="message success">
            <span>Upload complete</span>
            <small>{uploadedFile.object_key}</small>
          </div>
        )}
        <p className="privacy-note">The API issues a short-lived presigned URL. The file body travels straight to S3.</p>
      </section>

      <section className="gallery">
        <div className="gallery-heading">
          <div>
            <p className="kicker">S3 LIBRARY</p>
            <h2>All images <span>{images.length}</span></h2>
          </div>
          <button className="refresh-button" type="button" onClick={loadImages} disabled={galleryState === 'loading'}>Refresh ↻</button>
        </div>
        {galleryState === 'loading' && <p className="gallery-empty">Loading your library...</p>}
        {galleryState === 'error' && <p className="gallery-empty">Could not load the image library.</p>}
        {galleryState === 'ready' && images.length === 0 && <p className="gallery-empty">Uploaded images will appear here.</p>}
        {images.length > 0 && (
          <div className="image-grid">
            {images.map((image) => (
              <article className="image-card" key={image.id}>
                <img src={image.url} alt={image.file_name} />
                <div className="image-meta">
                  <strong>{image.file_name}</strong>
                  <small>{formatBytes(Number(image.file_size))}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
