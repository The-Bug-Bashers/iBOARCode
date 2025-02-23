package boar.lidar;

import ev3dev.sensors.slamtec.RPLidarA1;
import ev3dev.sensors.slamtec.model.Scan;
import java.util.ArrayList;
import java.util.List;

public class LiDARService {
    private final RPLidarA1 lidar;
    private volatile boolean running = true;
    // Global storage for the latest scan data (each measurement formatted as a JSON object)
    private final List<String> globalScanData = new ArrayList<>();

    public LiDARService() {
        try {
            // Create and initialize the RPLidarA1 instance (this starts the motor internally)
            lidar = new RPLidarA1("/dev/ttyUSB0");
            lidar.init();
        } catch (Exception e) {
            throw new RuntimeException("Error initializing RPLidar: " + e.getMessage(), e);
        }
        startContinuousReading();
    }

    private void startContinuousReading() {
        Thread scanThread = new Thread(() -> {
            while (running) {
                try {
                    // Blocking call that returns a full 360° scan
                    Scan scan = lidar.scan();
                    List<String> scanData = new ArrayList<>();
                    // Use a lambda to process each measurement without an explicit type declaration.
                    scan.getDistances().forEach(measure -> {
                        // The measurement object (as provided by the library) is expected to have
                        // methods getQuality(), getAngle(), and getDistance()
                        double angle = measure.getAngle();
                        int distance = (int) measure.getDistance();
                        String dataPoint = String.format("{\"angle\": %.2f, \"distance\": %d}", angle, distance);
                        scanData.add(dataPoint);
                    });
                    synchronized (globalScanData) {
                        globalScanData.clear();
                        globalScanData.addAll(scanData);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
        scanThread.setDaemon(true);
        scanThread.start();
    }

    /**
     * Returns the latest scan data as a JSON array string.
     */
    public synchronized String getLatestData() {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        synchronized (globalScanData) {
            for (int i = 0; i < globalScanData.size(); i++) {
                sb.append(globalScanData.get(i));
                if (i < globalScanData.size() - 1) {
                    sb.append(",");
                }
            }
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * Stops scanning and closes the lidar connection.
     */
    public void close() {
        running = false;
        try {
            lidar.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
