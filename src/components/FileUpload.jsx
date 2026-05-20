import { useRef, useState } from 'react';

export default function FileUpload({ onFileLoaded, loading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (file && file.name.endsWith('.csv')) onFileLoaded(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-8 py-12 cursor-pointer transition-colors
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm font-medium text-slate-700">
        {loading ? 'Processing...' : 'Drop CSV file here or click to browse'}
      </p>
      <p className="text-xs text-slate-400 mt-1">Practice management CSV export</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}
