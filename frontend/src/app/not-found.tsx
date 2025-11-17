"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Home, ArrowLeft, Search, FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Number with gradient */}
        <div className="relative">
          <h1 className="text-[12rem] md:text-[16rem] font-black leading-none bg-gradient-to-br from-primary/20 via-primary/10 to-transparent bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion className="h-24 w-24 md:h-32 md:w-32 text-primary/30 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 -mt-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been
            moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Link href="/">
            <Button
              color="primary"
              size="lg"
              startContent={<Home className="h-5 w-5" />}
              className="min-w-[200px]"
            >
              Go to Home
            </Button>
          </Link>
          <Button
            variant="bordered"
            size="lg"
            onPress={() => window.history.back()}
            startContent={<ArrowLeft className="h-5 w-5" />}
            className="min-w-[200px]"
          >
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="light" size="sm" className="text-muted-foreground hover:text-primary">
                Dashboard
              </Button>
            </Link>
            <Link href="/leads">
              <Button variant="light" size="sm" className="text-muted-foreground hover:text-primary">
                Leads
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="light" size="sm" className="text-muted-foreground hover:text-primary">
                Applications
              </Button>
            </Link>
            <Link href="/counsellings">
              <Button variant="light" size="sm" className="text-muted-foreground hover:text-primary">
                Counsellings
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}

