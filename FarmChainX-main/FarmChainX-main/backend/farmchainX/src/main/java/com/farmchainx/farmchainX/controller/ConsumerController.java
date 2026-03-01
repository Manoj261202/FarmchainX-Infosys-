package com.farmchainx.farmchainX.controller;

import com.farmchainx.farmchainX.model.SupplyChainLog;
import com.farmchainx.farmchainX.model.User;
import com.farmchainx.farmchainX.repository.SupplyChainLogRepository;
import com.farmchainx.farmchainX.repository.UserRepository;
import com.farmchainx.farmchainX.repository.RetailerInventoryRepository;
import com.farmchainx.farmchainX.service.ProductService;
import com.farmchainx.farmchainX.util.HashUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consumer")
public class ConsumerController {

    private final SupplyChainLogRepository supplyChainLogRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final RetailerInventoryRepository retailerInventoryRepository;

    public ConsumerController(
            SupplyChainLogRepository supplyChainLogRepository,
            UserRepository userRepository,
            ProductService productService,
            RetailerInventoryRepository retailerInventoryRepository) {
        this.supplyChainLogRepository = supplyChainLogRepository;
        this.userRepository = userRepository;
        this.productService = productService;
        this.retailerInventoryRepository = retailerInventoryRepository;
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('CONSUMER')")
    public List<Map<String, Object>> getConsumerHistory(Principal principal) {
        User consumer = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SupplyChainLog> myPurchases = supplyChainLogRepository
                .findByToUserIdOrderByTimestampDesc(consumer.getId());

        List<Map<String, Object>> history = new java.util.ArrayList<>();

        for (SupplyChainLog log : myPurchases) {
            if (log.getNotes() != null && log.getNotes().contains("Sold to Consumer")) {
                Map<String, Object> item = new java.util.HashMap<>();
                item.put("id", "ORD-" + log.getId());
                item.put("date", log.getTimestamp());
                item.put("total", 0);
                item.put("status", "Delivered");
                item.put("vendor", "FarmChainX Market");

                try {
                    com.farmchainx.farmchainX.model.Product p = productService
                            .getProductById(log.getProductId());
                    if (p != null) {
                        item.put("total", p.getPrice());
                        item.put("items", List.of(Map.of(
                                "name", p.getCropName(),
                                "qty", "1 unit",
                                "price", p.getPrice(),
                                "image", p.getImagePath())));
                        item.put("ecoScore", 90 + (p.getId() % 10));
                        item.put("productId", p.getId());
                        item.put("publicUuid", p.getPublicUuid());
                    }
                } catch (Exception e) {
                    item.put("items", List.of());
                }
                history.add(item);
            }
        }
        return history;
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasAnyRole('CONSUMER')")
    @Transactional
    public ResponseEntity<?> purchaseProduct(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            Long productId = Long.valueOf(String.valueOf(payload.get("productId")));
            String location = (String) payload.getOrDefault("location", "Online Store");

            User consumer = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            SupplyChainLog lastLog = supplyChainLogRepository
                    .findTopByProductIdOrderByTimestampDesc(productId)
                    .orElse(null);

            Long fromUserId = lastLog != null ? lastLog.getToUserId() : null;
            boolean isFromRetailer = false;

            if (fromUserId != null) {
                User fromUser = userRepository.findById(fromUserId).orElse(null);
                if (fromUser != null) {
                    isFromRetailer = fromUser.getRoles().stream()
                            .anyMatch(r -> "ROLE_RETAILER".equals(r.getName()));
                }
            }

            if (isFromRetailer && fromUserId != null) {
                java.util.Optional<com.farmchainx.farmchainX.model.RetailerInventory> inventoryOpt = retailerInventoryRepository
                        .findByRetailerIdAndProductId(fromUserId, productId);

                if (!inventoryOpt.isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Product not available in retailer inventory"));
                }

                com.farmchainx.farmchainX.model.RetailerInventory inventory = inventoryOpt.get();
                if (inventory.getQuantity() == null || inventory.getQuantity() <= 0) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Product is out of stock"));
                }

                inventory.setQuantity(inventory.getQuantity() - 1);
                if (inventory.getQuantity() <= 0) {
                    inventory.setStatus("OUT_OF_STOCK");
                }
                retailerInventoryRepository.save(inventory);

            } else {
                if (lastLog != null && lastLog.getNotes() != null
                        && lastLog.getNotes().contains("Sold to Consumer")) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "Product already sold"));
                }
            }

            SupplyChainLog purchaseLog = new SupplyChainLog();
            purchaseLog.setProductId(productId);
            purchaseLog.setFromUserId(fromUserId);
            purchaseLog.setToUserId(consumer.getId());
            purchaseLog.setLocation(location);
            purchaseLog.setNotes("Sold to Consumer " + consumer.getName() +
                    (isFromRetailer ? " (via Retailer)" : " (Direct from Farmer)"));
            purchaseLog.setCreatedBy(consumer.getEmail());
            purchaseLog.setConfirmed(true);
            purchaseLog.setConfirmedAt(java.time.LocalDateTime.now());
            purchaseLog.setConfirmedById(consumer.getId());
            purchaseLog.setTimestamp(java.time.LocalDateTime.now());

            String prevHash = lastLog != null ? lastLog.getHash() : "";
            purchaseLog.setPrevHash(prevHash);
            purchaseLog.setHash(HashUtil.computeHash(purchaseLog, prevHash));

            supplyChainLogRepository.save(purchaseLog);

            return ResponseEntity.ok(Map.of(
                    "message", "Purchase successful",
                    "orderId", "ORD-" + purchaseLog.getId()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
