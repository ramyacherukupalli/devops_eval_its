pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "ramyacherukupalli/its_proj:latest"
    }

    stages {
        stage('Fetch Source Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/ramyacherukupalli/devops_eval_its.git'
            }
        }

        stage('SonarCloud Scan') {
            options {
                // Retries the stage up to 3 times in case of intermittent DNS/Network timeouts
                retry(3)
            }
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withCredentials([string(
                        credentialsId: 'sonar-token',
                        variable: 'SONAR_TOKEN'
                    )]) {
                        // Added explicit host URL parameter to ensure strict routing
                        bat """
                        set SONAR_TOKEN=%SONAR_TOKEN%
                        ${scannerHome}\\bin\\sonar-scanner.bat -Dsonar.host.url=https://sonarcloud.io
                        """
                    }
                }
            }
        }

        stage('Dependency & Vulnerability Scan - Trivy') {
            steps {
                bat 'docker run --rm -v %cd%:/app aquasec/trivy fs --scanners vuln --skip-dirs /app/venv --timeout 20m /app'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %DOCKER_IMAGE% .'
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                    bat 'docker push %DOCKER_IMAGE%'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline Executed Successfully'
        }
        failure {
            echo 'Pipeline Failed'
        }
    }
}