import { useId, useState } from 'react';
import { UI_COPY } from '../../ui/copy';
import { asSession, readJsonFile, type HostSession } from '../state/storage';
import styles from './LoadSavedGame.module.css';

/** Restore a backup downloaded from the host menu. */
export function LoadSavedGame({ onLoad }: { onLoad: (session: HostSession) => void }) {
  const id = useId();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <label className={styles.button} htmlFor={id}>
        {UI_COPY.setup.loadFile}
        <input
          id={id}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const session = asSession(await readJsonFile(file).catch(() => null));
            setFailed(!session);
            if (session) onLoad(session);
          }}
        />
      </label>
      {failed && (
        <p className="text-body text-error" role="alert">
          {UI_COPY.setup.loadError}
        </p>
      )}
    </>
  );
}
