# Step 7: Data Persistence & State Management

## Step Description
Implement comprehensive data persistence using localforage, build autosave functionality with debouncing, create a draft recovery system, and handle sensitivity policies for different types of form data.

## Prerequisites
- Step 6 (Form Renderer) completed
- localforage installed and configured
- Understanding of sensitivity levels from PRD
- Encryption library available (crypto-js)
- Form context system established

## Detailed To-Do List

### 7.1 Persistence Manager Core
```typescript
// src/persistence/PersistenceManager.ts

import localforage from 'localforage';
import CryptoJS from 'crypto-js';

export interface PersistenceConfig {
  formId: string;
  schemaVersion: string;
  userId?: string;
  encryptionKey?: string;
  ttlDays?: number;
  sensitivity?: 'low' | 'medium' | 'high';
  allowAutosave?: boolean;
}

export interface DraftData {
  formId: string;
  schemaVersion: string;
  payloadVersion: string;
  data: any;
  currentStep: string;
  completedSteps: string[];
  metadata: DraftMetadata;
}

export interface DraftMetadata {
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  deviceId: string;
  sessionId: string;
  saveCount: number;
  isComplete: boolean;
  isEncrypted: boolean;
}

export class PersistenceManager {
  private store: LocalForage;
  private config: PersistenceConfig;
  private saveQueue: Map<string, any> = new Map();
  private saveTimer: NodeJS.Timeout | null = null;
  private encryptionKey: string | null;
  
  constructor(config: PersistenceConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey || null;
    
    // Initialize localforage instance
    this.store = localforage.createInstance({
      name: 'FormBuilder',
      storeName: 'drafts',
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE
      ],
      description: 'Form draft storage'
    });
    
    this.initializeStore();
  }
  
  private async initializeStore(): Promise<void> {
    try {
      // Check storage availability
      await this.store.ready();
      
      // Clean expired drafts
      await this.cleanExpiredDrafts();
      
      // Set up periodic cleanup
      setInterval(() => this.cleanExpiredDrafts(), 60 * 60 * 1000); // Every hour
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }
  
  async saveDraft(
    data: any,
    currentStep: string,
    completedSteps: string[],
    options?: SaveOptions
  ): Promise<void> {
    // Check if autosave is allowed
    if (!this.config.allowAutosave && !options?.manual) {
      return;
    }
    
    // Check sensitivity level
    if (this.config.sensitivity === 'high' && !this.encryptionKey) {
      console.warn('High sensitivity data requires encryption');
      return;
    }
    
    const draftKey = this.getDraftKey();
    
    // Add to save queue for debouncing
    this.saveQueue.set(draftKey, {
      data,
      currentStep,
      completedSteps,
      timestamp: Date.now()
    });
    
    // Debounce saves
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = setTimeout(
      () => this.processSaveQueue(),
      options?.immediate ? 0 : 500
    );
  }
  
  private async processSaveQueue(): Promise<void> {
    const saves = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();
    
    for (const [key, draft] of saves) {
      try {
        await this.persistDraft(key, draft);
      } catch (error) {
        console.error('Failed to save draft:', error);
        // Re-queue failed saves
        this.saveQueue.set(key, draft);
      }
    }
  }
  
  private async persistDraft(
    key: string,
    draft: any
  ): Promise<void> {
    const existingDraft = await this.store.getItem<DraftData>(key);
    
    // Prepare data
    let dataToSave = draft.data;
    let isEncrypted = false;
    
    // Encrypt if needed
    if (this.shouldEncrypt()) {
      dataToSave = this.encrypt(dataToSave);
      isEncrypted = true;
    }
    
    // Compress if large
    if (this.shouldCompress(dataToSave)) {
      dataToSave = await this.compress(dataToSave);
    }
    
    const draftData: DraftData = {
      formId: this.config.formId,
      schemaVersion: this.config.schemaVersion,
      payloadVersion: '1.0.0',
      data: dataToSave,
      currentStep: draft.currentStep,
      completedSteps: draft.completedSteps,
      metadata: {
        createdAt: existingDraft?.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: this.getExpiryDate(),
        deviceId: this.getDeviceId(),
        sessionId: this.getSessionId(),
        saveCount: (existingDraft?.metadata.saveCount || 0) + 1,
        isComplete: false,
        isEncrypted
      }
    };
    
    await this.store.setItem(key, draftData);
    
    // Emit save event
    this.emitSaveEvent(draftData);
  }
  
  async loadDraft(): Promise<DraftData | null> {
    try {
      const draftKey = this.getDraftKey();
      const draft = await this.store.getItem<DraftData>(draftKey);
      
      if (!draft) {
        return null;
      }
      
      // Check expiry
      if (this.isExpired(draft)) {
        await this.deleteDraft();
        return null;
      }
      
      // Decrypt if needed
      if (draft.metadata.isEncrypted && this.encryptionKey) {
        draft.data = this.decrypt(draft.data);
      }
      
      // Decompress if needed
      if (this.isCompressed(draft.data)) {
        draft.data = await this.decompress(draft.data);
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }
  
  async deleteDraft(): Promise<void> {
    const draftKey = this.getDraftKey();
    await this.store.removeItem(draftKey);
  }
  
  async getAllDrafts(): Promise<DraftData[]> {
    const drafts: DraftData[] = [];
    
    await this.store.iterate<DraftData>((value, key) => {
      if (value && !this.isExpired(value)) {
        drafts.push(value);
      }
    });
    
    return drafts;
  }
  
  private async cleanExpiredDrafts(): Promise<void> {
    const keysToDelete: string[] = [];
    
    await this.store.iterate<DraftData>((value, key) => {
      if (this.isExpired(value)) {
        keysToDelete.push(key);
      }
    });
    
    for (const key of keysToDelete) {
      await this.store.removeItem(key);
    }
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned ${keysToDelete.length} expired drafts`);
    }
  }
  
  private shouldEncrypt(): boolean {
    return this.config.sensitivity === 'high' && !!this.encryptionKey;
  }
  
  private encrypt(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }
  
  private decrypt(encryptedData: string): any {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not provided');
    }
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    return JSON.parse(jsonString);
  }
  
  private shouldCompress(data: any): boolean {
    const size = new Blob([JSON.stringify(data)]).size;
    return size > 50 * 1024; // 50KB threshold
  }
  
  private async compress(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const data_uint8 = encoder.encode(jsonString);
    
    const compressionStream = new CompressionStream('gzip');
    const writer = compressionStream.writable.getWriter();
    writer.write(data_uint8);
    writer.close();
    
    const compressedData = await new Response(compressionStream.readable).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(compressedData)));
  }
  
  private async decompress(compressedData: string): Promise<any> {
    const binaryString = atob(compressedData);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decompressionStream = new DecompressionStream('gzip');
    const writer = decompressionStream.writable.getWriter();
    writer.write(bytes);
    writer.close();
    
    const decompressedData = await new Response(decompressionStream.readable).text();
    return JSON.parse(decompressedData);
  }
  
  private isCompressed(data: any): boolean {
    return typeof data === 'string' && data.startsWith('H4sI'); // GZIP magic number in base64
  }
  
  private getDraftKey(): string {
    const userId = this.config.userId || 'anonymous';
    return `draft_${this.config.formId}_${this.config.schemaVersion}_${userId}`;
  }
  
  private getExpiryDate(): string {
    const ttlDays = this.config.ttlDays || 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + ttlDays);
    return expiryDate.toISOString();
  }
  
  private isExpired(draft: DraftData): boolean {
    if (!draft.metadata.expiresAt) {
      return false;
    }
    
    return new Date(draft.metadata.expiresAt) < new Date();
  }
  
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    
    return deviceId;
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    
    return sessionId;
  }
  
  private emitSaveEvent(draft: DraftData): void {
    window.dispatchEvent(new CustomEvent('formDraftSaved', {
      detail: {
        formId: draft.formId,
        saveCount: draft.metadata.saveCount,
        timestamp: draft.metadata.updatedAt
      }
    }));
  }
}
```

### 7.2 Autosave Hook
```typescript
// src/persistence/useAutosave.ts

export interface UseAutosaveOptions {
  enabled?: boolean;
  interval?: number;
  onSave?: () => void;
  onError?: (error: Error) => void;
  sensitivity?: 'low' | 'medium' | 'high';
}

export function useAutosave(
  formId: string,
  schemaVersion: string,
  formData: any,
  currentStep: string,
  completedSteps: string[],
  options: UseAutosaveOptions = {}
): AutosaveState {
  const [state, setState] = useState<AutosaveState>({
    lastSaved: null,
    isSaving: false,
    saveCount: 0,
    error: null
  });
  
  const persistenceManager = useRef<PersistenceManager>();
  const saveTimer = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Initialize persistence manager
    persistenceManager.current = new PersistenceManager({
      formId,
      schemaVersion,
      sensitivity: options.sensitivity || 'low',
      allowAutosave: options.enabled !== false,
      encryptionKey: options.sensitivity === 'high' ? 
        generateEncryptionKey() : undefined
    });
    
    // Load existing draft on mount
    loadDraft();
    
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [formId, schemaVersion]);
  
  const loadDraft = useCallback(async () => {
    try {
      const draft = await persistenceManager.current?.loadDraft();
      
      if (draft) {
        // Emit event for form to handle loaded data
        window.dispatchEvent(new CustomEvent('draftLoaded', {
          detail: draft
        }));
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, []);
  
  const saveDraft = useCallback(async (immediate = false) => {
    if (!persistenceManager.current || !options.enabled) {
      return;
    }
    
    setState(prev => ({ ...prev, isSaving: true, error: null }));
    
    try {
      await persistenceManager.current.saveDraft(
        formData,
        currentStep,
        completedSteps,
        { immediate, manual: immediate }
      );
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        saveCount: prev.saveCount + 1
      }));
      
      options.onSave?.();
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: err
      }));
      
      options.onError?.(err);
    }
  }, [formData, currentStep, completedSteps, options]);
  
  // Debounced autosave
  useEffect(() => {
    if (!options.enabled) return;
    
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    
    saveTimer.current = setTimeout(() => {
      saveDraft(false);
    }, options.interval || 5000);
    
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [formData, currentStep, completedSteps, saveDraft, options]);
  
  const clearDraft = useCallback(async () => {
    try {
      await persistenceManager.current?.deleteDraft();
      setState(prev => ({
        ...prev,
        lastSaved: null,
        saveCount: 0
      }));
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);
  
  return {
    ...state,
    saveDraft: () => saveDraft(true),
    clearDraft,
    loadDraft
  };
}
```

### 7.3 Draft Recovery UI
```typescript
// src/persistence/DraftRecovery.tsx

interface DraftRecoveryProps {
  draft: DraftData;
  onRecover: (data: any) => void;
  onDiscard: () => void;
}

export const DraftRecovery: React.FC<DraftRecoveryProps> = ({
  draft,
  onRecover,
  onDiscard
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  const timeSinceUpdate = formatDistanceToNow(
    new Date(draft.metadata.updatedAt),
    { addSuffix: true }
  );
  
  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unsaved Draft Found</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          You have an unsaved draft from {timeSinceUpdate}.
          Would you like to continue where you left off?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onRecover(draft.data);
              setIsVisible(false);
            }}
          >
            Recover Draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onDiscard();
              setIsVisible(false);
            }}
          >
            Start Fresh
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Draft management dialog
export const DraftManagementDialog: React.FC<{
  formId: string;
  onSelectDraft: (draft: DraftData) => void;
}> = ({ formId, onSelectDraft }) => {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadDrafts();
  }, []);
  
  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const manager = new PersistenceManager({
        formId,
        schemaVersion: '*' // Load all versions
      });
      
      const allDrafts = await manager.getAllDrafts();
      const formDrafts = allDrafts.filter(d => d.formId === formId);
      
      setDrafts(formDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteDraft = async (draft: DraftData) => {
    try {
      const manager = new PersistenceManager({
        formId: draft.formId,
        schemaVersion: draft.schemaVersion
      });
      
      await manager.deleteDraft();
      loadDrafts(); // Refresh list
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };
  
  if (isLoading) {
    return <div>Loading drafts...</div>;
  }
  
  if (drafts.length === 0) {
    return <div>No drafts found</div>;
  }
  
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Available Drafts</h3>
      {drafts.map((draft, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                Version {draft.schemaVersion}
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {formatDistanceToNow(
                  new Date(draft.metadata.updatedAt),
                  { addSuffix: true }
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Progress: Step {draft.currentStep} 
                ({draft.completedSteps.length} completed)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSelectDraft(draft)}
              >
                Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteDraft(draft)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

### 7.4 Conflict Resolution
```typescript
// src/persistence/ConflictResolver.ts

export class ConflictResolver {
  static async resolveConflicts(
    localDraft: DraftData,
    remoteDraft: DraftData
  ): Promise<DraftData> {
    // Compare timestamps
    const localTime = new Date(localDraft.metadata.updatedAt);
    const remoteTime = new Date(remoteDraft.metadata.updatedAt);
    
    // Last write wins by default
    if (remoteTime > localTime) {
      return remoteDraft;
    }
    
    // If local is newer, check for conflicts
    const conflicts = this.detectConflicts(localDraft.data, remoteDraft.data);
    
    if (conflicts.length === 0) {
      return localDraft;
    }
    
    // Merge non-conflicting fields
    const merged = this.mergeData(
      localDraft.data,
      remoteDraft.data,
      conflicts
    );
    
    return {
      ...localDraft,
      data: merged,
      metadata: {
        ...localDraft.metadata,
        hasConflicts: true,
        conflictFields: conflicts
      }
    };
  }
  
  private static detectConflicts(
    local: any,
    remote: any
  ): string[] {
    const conflicts: string[] = [];
    
    const checkObject = (obj1: any, obj2: any, path = '') => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (obj2.hasOwnProperty(key)) {
          if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            checkObject(obj1[key], obj2[key], currentPath);
          } else if (obj1[key] !== obj2[key]) {
            conflicts.push(currentPath);
          }
        }
      }
    };
    
    checkObject(local, remote);
    return conflicts;
  }
  
  private static mergeData(
    local: any,
    remote: any,
    conflicts: string[]
  ): any {
    const merged = { ...remote };
    
    // Keep local values for non-conflicting fields
    const applyLocal = (obj: any, source: any, path = '') => {
      for (const key in source) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!conflicts.includes(currentPath)) {
          if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
            obj[key] = obj[key] || {};
            applyLocal(obj[key], source[key], currentPath);
          } else {
            obj[key] = source[key];
          }
        }
      }
    };
    
    applyLocal(merged, local);
    return merged;
  }
}
```

## Test Cases

### Persistence Manager Tests
```typescript
describe('Persistence Manager', () => {
  let manager: PersistenceManager;
  
  beforeEach(() => {
    manager = new PersistenceManager({
      formId: 'test-form',
      schemaVersion: '1.0.0',
      sensitivity: 'low',
      allowAutosave: true
    });
  });
  
  afterEach(async () => {
    await manager.deleteDraft();
  });
  
  it('should save and load draft', async () => {
    const testData = {
      field1: 'value1',
      field2: 123
    };
    
    await manager.saveDraft(testData, 'step1', ['step0'], {
      immediate: true
    });
    
    const loaded = await manager.loadDraft();
    
    expect(loaded).toBeTruthy();
    expect(loaded?.data).toEqual(testData);
    expect(loaded?.currentStep).toBe('step1');
  });
  
  it('should encrypt high sensitivity data', async () => {
    const secureManager = new PersistenceManager({
      formId: 'secure-form',
      schemaVersion: '1.0.0',
      sensitivity: 'high',
      encryptionKey: 'test-key-123',
      allowAutosave: true
    });
    
    const sensitiveData = {
      ssn: '123-45-6789',
      creditCard: '4111111111111111'
    };
    
    await secureManager.saveDraft(sensitiveData, 'step1', [], {
      immediate: true
    });
    
    // Check that data is encrypted in storage
    const raw = await localforage.getItem<DraftData>(
      'draft_secure-form_1.0.0_anonymous'
    );
    
    expect(raw?.metadata.isEncrypted).toBe(true);
    expect(raw?.data).not.toEqual(sensitiveData);
    
    // But loads correctly
    const loaded = await secureManager.loadDraft();
    expect(loaded?.data).toEqual(sensitiveData);
  });
  
  it('should clean expired drafts', async () => {
    // Create expired draft
    const expiredDraft: DraftData = {
      formId: 'test-form',
      schemaVersion: '1.0.0',
      payloadVersion: '1.0.0',
      data: {},
      currentStep: 'step1',
      completedSteps: [],
      metadata: {
        createdAt: '2020-01-01',
        updatedAt: '2020-01-01',
        expiresAt: '2020-01-02',
        deviceId: 'test',
        sessionId: 'test',
        saveCount: 1,
        isComplete: false,
        isEncrypted: false
      }
    };
    
    await localforage.setItem('expired-draft', expiredDraft);
    
    // Clean
    await manager['cleanExpiredDrafts']();
    
    // Check it's removed
    const result = await localforage.getItem('expired-draft');
    expect(result).toBeNull();
  });
});
```

### Autosave Hook Tests
```typescript
describe('useAutosave', () => {
  it('should autosave on data change', async () => {
    const { result } = renderHook(() =>
      useAutosave(
        'test-form',
        '1.0.0',
        { field: 'value' },
        'step1',
        [],
        { enabled: true, interval: 100 }
      )
    );
    
    // Wait for autosave
    await waitFor(() => {
      expect(result.current.saveCount).toBeGreaterThan(0);
    }, { timeout: 200 });
  });
  
  it('should not autosave when disabled', async () => {
    const { result } = renderHook(() =>
      useAutosave(
        'test-form',
        '1.0.0',
        { field: 'value' },
        'step1',
        [],
        { enabled: false }
      )
    );
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(result.current.saveCount).toBe(0);
  });
});
```

## Success Criteria
- ✅ Draft persistence with IndexedDB fallback
- ✅ Encryption for high-sensitivity data
- ✅ Compression for large forms
- ✅ Autosave with debouncing
- ✅ Draft recovery on page reload
- ✅ Conflict resolution for concurrent edits
- ✅ Expiry and cleanup of old drafts
- ✅ Sensitivity-based persistence policies

## Implementation Notes

### Security Considerations
- Use Web Crypto API for encryption when available
- Never store encryption keys in localStorage
- Clear sensitive data on logout
- Implement rate limiting for save operations

### Performance Optimizations
- Debounce autosave operations
- Compress large data before storage
- Use IndexedDB for better performance
- Batch save operations when possible

### Browser Compatibility
- Fallback to localStorage if IndexedDB unavailable
- Handle quota exceeded errors gracefully
- Test on mobile browsers with limited storage
- Provide clear storage management UI

## Next Steps
With persistence complete:
1. Build computed fields and data sources (Step 8)
2. Add offline mode support
3. Implement sync with backend
4. Create storage quota management
5. Add data export/import functionality