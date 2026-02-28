interface AlertEngine<T> {
    processObservations(observations: T): Promise<void>;
    dispose(): void;
}

export default AlertEngine;