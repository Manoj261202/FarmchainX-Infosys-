package com.farmchainX.farmchainX.configuration;

import java.util.HashSet;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.farmchainX.farmchainX.model.Role;
import com.farmchainX.farmchainX.model.User;
import com.farmchainX.farmchainX.repository.RoleRepository;
import com.farmchainX.farmchainX.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(RoleRepository roleRepo, UserRepository userRepo, PasswordEncoder encoder) {
        this.roleRepo = roleRepo;
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {

        // 1) Create all roles first
        String[] roles = {"ROLE_CONSUMER", "ROLE_FARMER", "ROLE_DISTRIBUTOR", "ROLE_RETAILER", "ROLE_ADMIN"};
        for (String r : roles) {
            if (!roleRepo.existsByName(r)) {
                Role role = new Role();
                role.setName(r);
                roleRepo.save(role);
            }
        }

        // 2) Create default admin
        String email = "admin@farmchainx.com";

        if (!userRepo.existsByEmailIgnoreCase(email)) {
            Role adminRole = roleRepo.findByName("ROLE_ADMIN").orElseThrow();

            User admin = new User();
            admin.setName("Admin");
            admin.setEmail(email);
            admin.setPassword(encoder.encode("admin123"));
            admin.setActive(true);
            admin.setRoles(new HashSet<>());
            admin.getRoles().add(adminRole);

            userRepo.saveAndFlush(admin);

            System.out.println("✅ Default admin created: " + email + " | password: admin123");
        } else {
            System.out.println("✅ Admin already exists, skipping.");
        }
    }
}