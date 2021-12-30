from setuptools import find_packages, setup

setup(
    name='statesynclib',
    packages=find_packages(include=['statesynclib']),
    version='0.0.1',
    description='A library to interact with the StateSync state management plugin',
    license='MIT',
)